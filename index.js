(function (exports) {
  'use strict';

  function Container(namespace, scope) {
    this.namespace = namespace;
    this.scope = scope;
    this.is_instantiated = false;
    this.cached = undefined;
  }

  Container.prototype.getDependencyList = function () {
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG_SPLIT = /,/;
    var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    function annotate(fn) {
      var $inject,
        fnText,
        argDecl,
        last;

      if (typeof fn == 'function') {
        if (!($inject = fn.$inject)) {
          $inject = [];
          fnText = fn.toString().replace(STRIP_COMMENTS, '');
          argDecl = fnText.match(FN_ARGS);
          argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
            arg.replace(FN_ARG, function(all, underscore, name){
              $inject.push(name);
            });
          });
          fn.$inject = $inject;
        }
      } else if (isArray(fn)) {
        last = fn.length - 1;
        assertArgFn(fn[last], 'fn')
        $inject = fn.slice(0, last);
      } else {
        assertArgFn(fn, 'fn', true);
      }
      return $inject;
    }

    return annotate(this.scope);
  };

  Container.prototype.build = function (dependencies) {
    this.is_instantiated = true;
    this.cached = new (Function.prototype.bind.apply(this.scope, dependencies));
    return this.cached;
  };

  function ContainerHolder() {
    this.containers = {};
  }

  ContainerHolder.prototype.container = function (namespace, scope) {
    this.containers[namespace] = new Container(namespace, scope);
  };

  ContainerHolder.prototype.hasDependency = function (namespace) {
    return (this.containers[namespace]);
  };

  ContainerHolder.prototype.checkDependencies = function (namespaces) {
    var pass = true
      , _this = this;
    namespaces.forEach(function (namespace) {
      if (!_this.hasDependency(namespace)) {
        throw new Error('Missing dependency for Contain.js!  The dependency named `' + namespace + '` is unavailable.');
      }
    });
    return pass;
  };

  ContainerHolder.prototype.checkCircularDependencies = function () {
    var all_dependencies = [];
    this.containers.forEach(function (container) {
      all_dependencies.concat(container.getDependencyList());
    });

    var unique_list = all_dependencies.filter(function (dependency, index) {
      return all_dependencies.indexOf(dependency) === index;
    });

    if (all_dependencies.length !== unique_list) {
      throw new Error('Circular dependency detected.  Please check your injectors and try again.');
    }
  }

  ContainerHolder.prototype.resolveDependencies = function (dependencies) {
    var _this = this;
    return dependencies.map(function (namespace) {
      return _this.build(namespace);
    });
  };

  ContainerHolder.prototype.build = function (namespace) {
    // this.checkCircularDependencies();
    var container = this.getContainer(namespace);
    if (container.is_instantiated) {
      return container.cached;
    }
    var dependencies = container.getDependencyList();
    this.checkDependencies(dependencies);
    var injected = this.resolveDependencies(dependencies);
    injected.unshift(null);
    return container.build(injected);
  };

  ContainerHolder.prototype.getContainer = function (namespace) {
    return this.containers[namespace];
  };

  exports.Contain = {

    holder: new ContainerHolder(),

    dependency: function (namespace, scope) {
      this.holder.container(namespace, scope);
      return this;
    },

    build: function (namespace, dependencies) {
      return this.holder.build(namespace);
    }

  }

}( window ));

var app = Contain
  .dependency('App', function (Users, Database) {

    this.users = Users;
    this.db = Database

  })
  .dependency('Users', function (Database) {

    var testing = 'alpha';

    this.findUser = function () {
      return Database.retrieve();
    };

    this.saveUser = function (user) {
      return Database.save(user);
    };

    this.setPrivate = function (value) {
      testing = value;
      return testing;
    };

    this.getPrivate = function () {
      return testing;
    };

  })
  .dependency('Database', function (Data) {

    this.save = function (user) {
      localStorage.setItem('demouser', Data.encode(user));
    };

    this.retrieve = function () {
      return Data.decode(localStorage.getItem('demouser'));
    };

  })
  .dependency('Data', function () {

    this.encode = function (data) {
      return JSON.stringify(data);
    };

    this.decode = function (data) {
      return JSON.parse(data);
    };

  })
  .build('App');