# SimpleContainer

An elegant method of managing application modules via dependency injection.

### Requirements

None.  Pure JavaScript.

### Usage

First, let's define our first dependency, a simple JSON encoder and decoder:

```javascript
Contain
  .dependency('Data', function () {

    this.encode = function (data) {
      return JSON.stringify(data);
    };

    this.decode = function (data) {
      return JSON.parse(data);
    };

  });
```

Now, let's define another dependency that will serve as our app's data layer that utilizes the encoder and decoder module that we just created:

```javascript
Contain
  .dependency('Database', function (Data) {
   
       this.save = function (user) {
         localStorage.setItem('demouser', Data.encode(user));
       };
    
       this.retrieve = function () {
         return Data.decode(localStorage.getItem('demouser'));
       };
    
     });
```

We can check the functionality of our application by using the `build()` method on the container object:

```javascript
var app = Contain.build('Database');

app.save({'type': 'user', 'id': 1, 'name': 'D-Rock'});
app.retrieve(); // Returns the user we just saved!
```

Now let's get a little more advanced and define a full app level namespace with a User model abstraction module:

```javascript
Contain

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
```

Notice on our Users model, we can define private variables and methods by choosing to not define those variables and methods onto `this`.  These private variables and methods are simply declared in the scope of the module.

Now we can tie it all together:

```javascript
var app = Contain.build('App');
app.users.findUser(); // Returns our user object we saved earlier!
app.users.getPrivate(); // Returns 'alpha'!
app.users.setPrivate('beta');
app.users.getPrivate(); // Now returns 'beta' from being set by the previous method!
```

### Credits

[Wes King](https://github.com/lewestopher) - Author

[Angular Devs for the annotate method](https://angularjs.org);

### License

Copyright 2016, Wes King

Licensed under The MIT License Redistributions of files must retain the above copyright notice.