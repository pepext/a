To setup your Super Bowl Squares app you need to:

- Create a MongoDB database

  The example app connects to a MongoDB instance for storing data. We use environment variables in the `.env` file to store the elements required to construct the database URL. The URL has the format mongodb://dbuser:dbpassword@host:port/dbname, so there are entries for `USER`, `PASS`, `HOST`, `DB_PORT` abd `DB` that you need to provide values for. If you create a database for free with [mlab](https://mlab.com), then these details are shown at the top of the [database page](http://docs.mlab.com/connecting/#connect-string).

- Setup a new app on Twitter

  Now go to [apps.twitter.com](https://apps.twitter.com) and click the 'Create a New App' button. Then fill in some basic information about your new app. Set the 'Callback URL' to your project's publish URL with '/login/twitter/return' appended. Your publish URL (click 'Show') has the format 'https://project-name.gomix.me'. So for our example app, the URL we used was: 'https://superbowl-squares.gomix.me/login/twitter/return'. With that done go to the Keys and Access Tokens tab and copy the Consumer Key and Consumer Secret into the `.env` file.

  While you're at it - paste your publish URL (https://project-name.gomix.me) against the `PROJECT_URL` entry in `.env` too.
  
Then you just need to set the `COOKIE_SECRET` value - this is a unique string (no spaces) that you make up, it's used to secure your sessions with.

And that's it. You should now be able to login to your app via Twitter and pick your boxes. Share it with your friends and colleagues to run your own Super Bowl Squares pool.


