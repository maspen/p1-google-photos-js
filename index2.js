'use strict';

// to load env conigs from .env
require('dotenv').config()

const async = require('async');
const bodyParser = require('body-parser');
const config = require('./config.js');
const express = require('express');
const expressWinston = require('express-winston');
const http = require('http');
const persist = require('node-persist');
const request = require('request-promise');
const session = require('express-session');
const sessionFileStore = require('session-file-store');
const uuid = require('uuid');
const winston = require('winston');

const app = express();
const fileStore = sessionFileStore(session);
const server = http.Server(app);

// use EJS template engine
app.set('view engine', 'ejs');

const mediaItemCache = persist.create({
  dir: 'persist-mediaitemcache/',
  ttl: 3300000, // 55 mins
});
mediaItemCache.init();

const albumCache = persist.create({
  dir: 'persist-albumcache/',
  ttl: 600000, // 10 mins
});
albumCache.init();

const storage = persist.create({
  dir: 'persist-storage/'
});
storage.init();

// set up OAuth2
const passport = require('passport');
const auth = require('./auth');
auth(passport);

// session middleware
const sessionMiddleware = session({
  resave: true,
  saveUninitialized: true,
  store: new fileStore({}),
  secret: 'mattz photo frame sample', // secret to sign cookies, this only used as example
});

// Enable extensive logging if the DEBUG environment variable is set.
if (process.env.DEBUG) {
  winston.level = 'silly';
  app.use(expressWinston.logger({
    transports: [new winston.transports.Console({json: true, colorize: true})]
  }));
  // enable request debugging
  require('request-promise').debug = true;
} else {
  // by default only print 'info' log mesages or below
  winston.level = 'verbose';
}

app.use(express.static('static'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/fancybox', express.static(__dirname + '/node_modules/@fancyapps/fancybox/dist/'));
app.use('/mdlite', express.static(__dirname + '/node_modules/material-design-lite/dist/'));
app.use('/favicon.ico', express.static(__dirname + '/imgs/favicon.ico'));

// parse application/json request data
app.use(bodyParser.json());

// parse application/xwww-form-urlenceded req. data
app.use(bodyParser.urlencoded({ extended: true }));

// enable use session handling
app.use(sessionMiddleware);

// set up passport & sessin handling
app.use(passport.initialize());
app.use(passport.session());

// middleware that adds use of this session as local var.
// so it can be displayed on all pages when logged in
app.use((req, res, next) => {

  console.log('index app.user .... for middleware');

  res.locals.name = '-';
  if (req.user && req.user.profile && req.user.profile.name) {
    res.locals.name = req.user.profile.name.givenName || req.user.profile.displayName;
    console.log('*** index app.use res.locals.name', res.locals.name);
  }

  res.locals.avatarUrl = '';
  if (req.user && req.user.profile && req.user.profile.photos) {
    res.locals.avatarUrl = req.user.profile.photos[0].value;
    console.log('*** index app.use res.locals.avatarUrl', res.locals.avatarUrl);
  }
  next();
});

// callback receiver for OAuth process after log in
app.get(
  '/auth/google/callback',
  passport.authenticate(
    'google', {failureRedirect: '/', failureFlash: true, session: true}
  ),
  (req, res) => {
    // user has logged in
    const authToken = req.user.token;
    const userId = req.user.profile.id;
    console.log('*** /auth/google/callback authToken, userId: ', authToken + ', ' + userId);
    console.log('*** /auth/google/callback - User has logged in, redirecting to /');


    winston.info('--- /auth/google/callback  User has logged in');
    res.redirect('/');
  }
);

// GET req. to the root - display login screen if user not logged in
// else, photo frame
app.get('/', (req, res) => {
  // const authToken = req.user.token;
  // const userId = req.user.profile.id;

  // console.log('*** / authToken, userId: ', authToken + ', ' + userId);

  if (!req.user || !req.isAuthenticated()) {
    // user not logged in yet
    console.log('*** index get / rendering pages/login');

    res.render('pages/login');
  } else {
    console.log('*** index get / rendering pages/frame');

    res.render('pages/frame');
  }
});

// GET req. to log out
app.get('/logout', (req, res) => {
  req.logout()
  req.session.destroy();
  res.redirect('/');
});

// GET req. to log out
// destroys current session & redirects back to
// log in screen
app.get(
  '/auth/google', 
  passport.authenticate('google', {
    scope: config.scopes,
    failureFlash: true,
    session: true,
  }
));

// NOTE: HAS to be moved below app.use so that can authenticate b/c
//       rendering the '/' page which requires 'authToken' to call
//       /getQueue
// // callback receiver for OAuth process after log in
// app.get(
//   '/auth/google/callback',
//   passport.authenticate(
//     'google', {failureRedirect: '/', failureFlash: true, session: true}
//   ),
//   (req, res) => {
//     // user has logged in
//     console.log('*** /auth/google/callback - User has logged in, redirecting to /');

//     winston.info('User has logged in');
//     res.redirect('/');
//   }
// );

// loads search page if user is authenticated
// - includes search form
app.get('/search', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/search');
});

// loads album page if use is authenticated
// - page displays list of albus owned by user
app.get('/album', (req, res) => {
  renderIfAuthenticated(req, res, 'pages/album');
});

// loads search page if user is authenticated
// this page dislays list of albums owned by user
app.post('/loadFromSearch', async (req, res) => {
  const authToken = req.user.token;

  console.log('*** index /loadFromSearch Loading images from search');

  winston.info('--- Loading images from search');
  // winston.silly('Received for data : ', req.body);
  winston.info('--- Received for data : ', req.body);

  // make filter for photos
  // other params are added below based on form submission.
  const filters = { 
    contentFilter: {}, 
    mediaTypeFilter: {mediaTypes: ['PHOTO']
  }};

  if (req.body.includedCategories) {
    // form included 'categories', add them to filter
    filters.contentFilter.includedContentCategories = 
      [ req.body.includedCategories ];
  }

  if (req.body.excludedCategories) {
    // form excluded categories, add to filter
    filters.contentFilter.excludedContentCategories = 
      [ req.body.excludedCategories ];
  };

  // add date filter is set, either as exact or range
  if (req.body.dateFilter == 'exact') {
    filters.dataFilter = {
      dates: constructDate(
        req.body.exactYear, req.body.exactMonth, req.body.exactDate
      ),
    }
  } else if (req.body.dateFilter == 'range') {
    filters.dateFilter = {
      ranges: [{
        startDate: constructDate(
            req.body.startYear, req.body.startMonth, req.body.startDay),
        endDate:
            constructDate(req.body.endYear, req.body.endMonth, req.body.endDay),
      }]
    }
  }

  // create param that will be submitted to library APi (?)
  const parameters = {filters};

  // submit search req. to API & wait for res.
  const data = await libraryApiSearch(authToken, parameters);

  console.log('*** index /loadFromSearch data returned from libraryApiSearch():', JSON.stringify(data));

  // return the cache & result & parameters
  const userId = req.user.profile.id;

  console.log('*** index /loadFromSearch calling returnPhotos()');

  returnPhotos(res, userId, data, parameters);
});

// handles selections from album page. user has slected an album
// and wants to load photos from album into photo frame.
// submits search for all media items in album to lib. API
// returns list of photos if they are successful, else, error
app.post('/loadFromAlbum', async (req, res) => {
  const albumId = req.body.albumId;
  const userId = req.user.profile.id;
  const authToken = req.user.token;

  console.log('*** index.js authToken: ', authToken);

  winston.info(`importing album: ${albumId}`);
  // NOTE: to list all media in an album, construct a search request
  // where the only parameter is the album ID.
  // Note that no other filters can be set, so this search will
  // also return videos that are otherwise filtered out in libraryApiSearch(..).
  const parameters = {albumId};

  // subnit search req. to API & wait for result
  const data = await libraryApiSearch(authToken, parameters);

  returnPhotos(res, userId, data, parameters);
});

// return all ablums owned by user
app.get('/getAlbums', async (req, res) => {
  const userId = req.user.profile.id;
  const authToken = req.user.token;

  console.log('*** index.js /getAlbums authToken:', authToken);
  winston.info('--- Loading albums');

  //conole.log('*** index.js /getAlbums authToken:', authToken);

  // Attempt to load the albums from cache if available.
  // Temporarily caching the albums makes the app more responsive.
  const cachedAlbums = await albumCache.getItem(userId);
  if (cachedAlbums) {
    conole.log('*** index.js /getAlbums loaded albums from cache');

    winston.verbose('Loaded albums from cache.');
    res.status(200).send(cachedAlbums);
  } else {
    console.log('*** index.js /getAlbums loading albums from API');

    winston.verbose('--- Loading albums from API.');
    // Albums not in cache, retrieve the albums from the Library API
    // and return them
    const data = await libraryApiGetAlbums(authToken);
    if (data.error) {
      // Error occured during the request. Albums could not be loaded.

      conole.log('*** index.js /getAlbums after libraryApiGetAlbums() error: ', data.error);

      returnError(res, data);
      // Clear the cached albums.
      albumCache.removeItem(userId);
    } else {
      // Albums were successfully loaded from the API. Cache them
      // temporarily to speed up the next request and return them.
      // The cache implementation automatically clears the data when the TTL is
      // reached.
      conole.log('*** index.js /getAlbums after libraryApiGetAlbums() sending back data');
      res.status(200).send(data);
      albumCache.setItemSync(userId, data);
    }
  }
});

// returns list of media items user selected to be shown on
// photo frame. If media items are still in temp. cache, they
// are directly returned, else search params that were used 
// to load photos are resubmitted to API
app.get('/getQueue', async (req, res) => {
  winston.info('--- loading queue');
  console.log('*** /getQueue userId, authToken: ', req.user.profile.id + ' ' + req.user.token);
  const userId = req.user.profile.id;
  const authToken = req.user.token;

  //console.log('*** index /getQueue userId, authToken', userId + ' ' + authToken);

  winston.info('--- loading queue');

  // try to load queue from cache 1st. it contains full mediaItems
  // that include URLs; which expire in 1 hr. TTL on cache is set
  // to this so items are cleared automatically once time limit is 
  // reached. caching speeds app up and is returned directly from
  // memory whenever user navigates back to photo frame.
  const cachedPhotos = await mediaItemCache.getItem(userId);
  const stored = await storage.getItem(userId);

  console.log('*** index /getQueue cachedPhotos: ', cachedPhotos);
  console.log('*** index /getQueuestored stored: ', stored);

  if (cachedPhotos) {
    console.log('*** index /getQueuereturning cached photos');

    winston.verbose('--- returning cached photos');
    res.status(200).send({photos: cachedPhotos, parameters: stored.parameters});
  } else if (stored && stored.parameters) {
    // items no longer cached, resubmit stored search query & return
    // results
    console.log('*** index /getQueue resubmitting filter search');

    winston.verbose(`--- resubmitting filter search ${JSON.stringify(stored.parameters)}`);

    const data = await libraryApiSearch(authToken, stored.parameters);
    returnPhotos(res, userId, data, stored.parameters);
  } else {
    // no data stored for user. return empty response. user is likely new
    console.log('*** index /getQueue no cached data, sending back {}');

    winston.verbose('--- no cached data');
    res.status(200).send({});
  }
});

// start the server
server.listen(config.port, () => {
  console.log(`App listening on port ${config.port}`);
  console.log('press Ctrl + C to quit');
});

// renders given page if user is authenticated, else redirects to '/'
function renderIfAuthenticated(req, res, page) {
  console.log('*** index renderIfAuthenticated() req.user.token:',  req.user.token);

  if (!req.user || !req.isAuthenticated()) {
    console.log('*** index renderIfAuthenticated() NOT authenticated, redirecting to /');

    res.redirect('/');
  } else {
    console.log('*** index renderIfAuthenticated() page:',  page);

    res.render(page);
  }
}

// if supplied res. is successful, the params. and media items are cached.
// helper method that returns and caches result from Library API search
// query returned by libraryApiSearch(...). if data.error field is set,
// data is handled as error and not cached. see returnError instead.
// else, media items are cached, search params. are store and returned in res.
function returnPhotos(res, userId, data, searchParameter) {
  console.log('*** index returnPhotos()');

  if (data.error && data.error !== []) {
    console.log('*** index returnPhotos() error: ', JSON.stringify(data.error));

    returnError(res, data);
  } else {
    // remove pageToken and pageSize from search params
    // they will be set again when req. is submitted but don't need to be
    // stored
    delete searchParameter.pageToken;
    delete searchParameter.pageSize;

    // cache media items that were loaded temporarily
    mediaItemCache.setItemSync(userId, data.photos);
    // store params tha were user to load images. theses are used to resubmit
    // query after cache expires
    storage.setItemSync(userId, {parameters: searchParameter});

    // return photos and params back
    console.log('*** index returnPhotos() seding back response w/ status 200');

    // returnPhotos(res, userId, data, parameters);
    res.status(200).send({photos: data.photos, parameters: searchParameter});
  }
}

// respond w/ error status code & encapsulate data.error
function returnError(res, data) {
  // return same status code that was returned, else 500
  const statusCode = data.error.code || 500;
  res.status(statusCode).send(data.error);
}

// construct date obj. required for Library API
// undefined params. are not set in date obj. which API sees as a wildcard
function constructDate(year, month, day) {
  const date = {};
  if (year) date.year = year;
  if (month) date.month = month;
  if (day) date.day = day;
  return date;
}

// submits search req. to Google Photo Lib. API for given params. the authToken is used
// to authenticate req. to API. the min number of results is configured in config.photo.photosToLoad
// this function makes multiple calls to API to load at leas as many photos as requested.
// they may result in more items being listed in res. than originally requested
async function libraryApiSearch(authToken, parameters) {
  let photos = [];
  let nextPageToken = [];
  let error = [];

  parameters.pageSize = config.searchPageSize;

  console.log('*** index libraryApiSearch ...');

  try {
    do {
      winston.info(`submitting search for params ${JSON.stringify(parameters)}`);

      console.log('*** index libraryApiSearch, calling with parameters: ',`${JSON.stringify(parameters)}`);

      const result = await request.post(config.apiEndpoint + '/v1/mediaItems:search', 
      {
        headers: {'Content-Type': 'application/json'},
        json: parameters,
        auth: {'bearer': authToken},
      });

      console.log('*** index libraryApiSearch response from google API /v1/mediaItems:search:', `${result}`);

      winston.debug(`--- Response: ${result}`);

      // list of media items retuned may be sparse & contain missing elements.
      // remove all invalid elements. also remove all elements that are not images
      // by checking its mime type
      // media type filters can't be applie if album is loaded, so an extra filter
      // step is required here so onl images are retuned.
      const items = result && result.mediaItems ? result.mediaItems
        .filter(x => x) // filter empty of invalid items
        // only keep media items w/ an image mime type
        .filter(x => x.mimeType && x.mimeType.startsWith('image/')) : [];

      photos = photos.concat(items);

      console.log('*** libraryApiSearch() photos:', photos.length);

      // set pageToken for next req.
      parameters.pageToken = result.nextPageToken;

      winston.verbose(`Found ${items.length} images in this request. total images ${photos.length }`);

      // loop until required # of photos has been loaded or until there are not more
      // photos. ie. there is no pageToken
    } while (photos.length < config.photosToLoad && parameters.pageToken != null);
  } catch (err) {
    // if error is StatusCodeError, it contains error.error obj. that should be returned.
    // it has a name, statusCode & message in correct format, else extract the properties
    error = err.error.error || {name: err.name, code: err.statusCode, message: err.message};

    console.log('*** libraryApiSearch() error:', JSON.stringify(error));

    winston.error(error);
  }

  winston.info('--- search completed, returning: photos.length, parameters, error', {photos, parameters, error});

  return {photos, parameters, error};
}

// returns list of all albums owned by logged in user from Library API
async function libraryApiGetAlbums(authToken) {
  console.log('*** libraryApiGetAlbums() authToken: ' + authToken);
  let albums = [];
  let nextPageToken = [];
  let error = null;
  let parameters = {pageSize: config.albumPageSize};

  try {
    // loop while there is a nextPageToken prop. in res. until all albums have been listed
    do {
      winston.verbose(`--- libraryApiGetAlbums() loading albums, received so far ${albums.length}`);
      // image GET req. to load all albums w/ optional params. (pageToke is set)
      // const result = await request.get(config.apiEndpoint + '/v1/albums', {
      //     headers: {'Content-Type': 'application/json'},
      //     qs: parameters,
      //     json: true,
      //     auth: {'bearer': authToken},
      // });
      // result.then(console.log('in then from album request.get'));

      // src: https://github.com/request/request-promise
      var options = {
        url: config.apiEndpoint + '/v1/albums',
        qs: parameters,
        json: true,
        auth: {'bearer': authToken},
        resolveWithFullResponse: true,
      };

      var result;
      console.log('*** libraryApiGetAlbums starting request:')
      await request(options)
      .then((albums) => {
        console.log('*** request albums;', albums);
        result = albums;
      })
      .catch((error) => {
        console.log('*** request error;', error);
        result = error;
      });
      console.log('*** libraryApiGetAlbums request END, result: ', result);

      winston.debug(`--- Response: ${result}`);

      if (result && result.albums) {
        winston.verbose(`Number of albums received: ${result.albums.length}`);
        // parse albums and add to the list, skipping empty entried
        const items = result.albums.filter(x => !!x);

        albums = albums.concat(items);
      }
      parameters.pageToken = result.nextPageToken;
      // loop until all albums have been listed and no new nextPageToken is returned
    } while (parameters.pageToken != null);
  } catch (err) {
    console.log('*** libraryApiGetAlbums try/catch error: ', err);
    // is error is a StatusCodeError, it contains error.error obj. tat should be returned.
    // it has name, statusCode & message in correct format, erlse extract the properties
    error = err.error.error || {name: err.name, code: err.statusCode, message: err.message};
    winston.error(error);
  }

  winston.info('-- albums loaded');

  return {albums, error};
}
