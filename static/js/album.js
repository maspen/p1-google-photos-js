// notifies backed to load album into photo frame queue
// if req. is succesful, photo frome queue is opened,
// else error msg is shown
function loadFromAlbum(name, id) {
  showLoadingDialog();
  // make ajax req. to backend to load album
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:8080/loadFromAlbum',
    dataType: 'json',
    data: {albumId: id},
    success: (data) => {
      console.log('album imported:' + JSON.stringify(data.parameters));
      if (data.photos && data.photos.length) {
        // photos were loaded from album, open photo preview queue
        window.location = '/';
      } else {
        // no photos loaded, display error
        handleError('couldn\'t import album. Album empty');
      }
      hideLoadingDialog();
    },
    error: (data) => {
      handleError('couldn\'t import album', data);
    }
  });
}

// loads list of all album owners by logged in user from backend
// backend returns list of albums from Library API that is
// rendered here in a list w/ a cover image, title and lik to
// open in Google Photos
function listAlbums() {
  console.log('*** album.js listAlbums() called, will do axaj to /getAlbums');

  hideError();
  showLoadingDialog();
  $('#albums').empty();

  $.ajax({
    type: 'GET',
    // async: false, / Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
    success: (data) => {
      console.log('loaded albums: ' + data.albums);
      // render each album from backend in its own row, consisting
      // of title, number of items, link to Google Photos and a
      // button to add it to the photo frame
      // items rendered here are albums that are returned from
      // the Library API
      $.each(data.albums, (i, item) => {
        // load and convert photo to 100x100px thumbnails
        // it is a base url, so height/width parms must be appended
        const thumbnailUrl = `${item.coverPhotoBaseUrl}=w100-h100`;

        // set up Material Design Lite list
        const materialDesignLiteList = 
          $('<li />').addClass('mdl-list__item mdl-list__item--two-line');

        // create primary content for this list item
        const primaryContentRoot = 
          $('<div />').addClass('mdl-list__item-primary-conent');
        materialDesignLiteList.append(primaryContentRoot);

        // the img showing album thumbnail
        const primaryContentImage = 
          $('<img />')
          .attr('src', thumbnailUrl)
          .attr('alt', item.title)
          .addClass('mdl-list__item-avatar');
        primaryContentRoot.append(primaryContentImage);

        // title of albums as the primary title of this item
        const primaryContentTitle = 
          $('<div />').text(item.title);
        primaryContentRoot.append(primaryContentTitle);

        // num. of items in this album as the sub title
        const primaryContentSubTitle = 
          $('<div />')
          .text(`(${item.totalMediaItems} items)`)
          .addClass('mdl-list__item-sub-title');
        primaryContentRoot.append(primaryContentSubTitle);

        // secondary content consists of 2 links w/ buttons
        const secondaryContentRoot = 
          $('<div />')
          .addClass('mdl-list__item-secondary-action');
        materialDesignLiteList.append(secondaryContentRoot);

        // 'add to photo frame' link
        const linkToAddToPhotoFrame = 
          $('<a />')
          .addClass('album-title')
          .attr('data-id', item.id)
          .attr('data-title', item.title);
        secondaryContentRoot.append(linkToAddToPhotoFrame);

        // btn for 'add to photo frame' link
        const addToPhotoFrameButton = 
          $('<button />')
          .addClass('mdl-button mdl-js-button mdl-button--raised mdl-button--accent')
          .text('Add to frame');
        linkToAddToPhotoFrame.append(addToPhotoFrameButton);

        // 'open' in Google Photos' link
        const linkToGooglePhotos = 
          $('<a />')
          .attr('target', '_blank')
          .attr('href', item.productUrl);
        secondaryContentRoot.append(linkToGooglePhotos);

        // btn for 'open in Google Photos' link
        const googlePhotosButton = 
          $('<button />')
          .addClass('gp-button raised')
          .text('Open in Google Photos');
        linkToGooglePhotos.append(googlePhotosButton);

        // add list item to list of albums
        $('#albums').append(materialDesignLiteList);
      });

      hideLoadingDialog();
      console.log('albums loaded');
    },
    error: (data) => {
      hideLoadingDialog();
      handleError('couldn\'t load albums', data);
    }
  });
}

function listAlbums2() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  var request = $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
    // dataType: 'jsonp',
    // callback: 'http://127.0.0.1:8080/auth/google/callback'
  });

  var success = function(data) {
    hideLoadingDialog();

    console.log('*** done w/ listAlbums2(), data: ', JSON.stringify(data));
  };
  var error = function(req, status, error) {
    hideLoadingDialog();

    console.log('*** fail w/ listAlbums2(), req, status, error: '
      , JSON.stringify(req) + ' ' + status + ' ' + JSON.stringify(error));
  };

  request.done(success);
  request.fail(error);
  //request.then(success, error);

  // request.fail((error) => {
  //   console.log('*** fail w/ listAlbums2(), error: ', JSON.stringify(error));
  // });

  // request.done((data) => {
  //   console.log('*** done w/ listAlbums2(), data: ', JSON.stringify(data));
  // });
}

function listAlbums3() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  var request = $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
  });

  var success = function(data) {
    hideLoadingDialog();

    console.log('*** done w/ listAlbums3(), data: ', JSON.stringify(data));
  };
  var error = function(req, status, error) {
    hideLoadingDialog();

    console.log('*** fail w/ listAlbums3(), req, status, error: '
      , JSON.stringify(req) + ' ' + status + ' ' + JSON.stringify(error));
  };

  request.then(success, error);
}

function listAlbums4() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  var request = $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
  });

  var success = function(data) {
    hideLoadingDialog();

    console.log('*** done w/ listAlbums4(), data: ', JSON.stringify(data));
  };
  var error = function(req, status, error) {
    hideLoadingDialog();

    console.log('*** fail w/ listAlbums4(), req, status, error: '
      , JSON.stringify(req) + ' ' + status + ' ' + JSON.stringify(error));
  };

  request.resolve(success); // thirows errors
  request.resolve(error);
}

function listAlbums5() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  var request = $.when($.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
  }));

  var success = function(data) {
    hideLoadingDialog();

    console.log('*** done w/ listAlbums5(), data: ', JSON.stringify(data));
  };
  var error = function(req, status, error) {
    hideLoadingDialog();

    console.log('*** fail w/ listAlbums5(), req, status, error: '
      , JSON.stringify(req) + ' ' + status + ' ' + JSON.stringify(error));
  };

  request.then(success, error);
}

function listAlbums6() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  // $.get( "test.php" ).then(
  //   function() {
  //     alert( "$.get succeeded" );
  //   }, function() {
  //     alert( "$.get failed!" );
  //   }
  // );

  console.log('*** listAlbums6() start');

  $.when( $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
  }) )
  .then(function( data, textStatus, jqXHR ) {
    console.log('*** listAlbums6() inside then()');
    console.log('data:', data);
    console.log('textStatus:', textStatus);
    console.log('jqXHR.status:', jqXHR.status);
    // alert( jqXHR.status ); // Alerts 200
  });

  hideLoadingDialog();

  console.log('*** listAlbums6() end');

  // var request = $.when($.ajax({
  //   type: 'GET',
  //   url: 'http://127.0.0.1:8080/getAlbums',
  //   dataType: 'json',
  // }));

  // var success = function(data) {
  //   hideLoadingDialog();

  //   console.log('*** done w/ listAlbums6(), data: ', JSON.stringify(data));
  // };
  // var error = function(req, status, error) {
  //   hideLoadingDialog();

  //   console.log('*** fail w/ listAlbums6(), req, status, error: '
  //     , JSON.stringify(req) + ' ' + status + ' ' + JSON.stringify(error));
  // };

  // request.then(success, error);
}

function listAlbums7() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  console.log('*** listAlbums7() start');

  function getReady() {
    var deferredReady = $.Deferred();
      $(document).ready(function() {
        deferredReady.resolve();
      });
    return deferredReady.promise();
  }

  var request = $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
  });

  $.when(request)
  .then(function(response) {
    console.log('*** listAlbums7() data: ' ,data);
    // set divs set
    getReady();
  })
  .done(function(readyResponse, data) {
    console.log('*** listAlbums7() add stuff to body');
  })

  hideLoadingDialog();

  console.log('*** listAlbums7() end');
}

// put above <script> in album.ejs
// function getReady() {
//   var deferredReady = $.Deferred();
//   $(document).ready(function() {
//     deferredReady.resolve();
//   });
//   return deferredReady.promise();
// }
function listAlbums8() {
  hideError();
  showLoadingDialog();

  $('#albums').empty();

  console.log('*** listAlbums8() start');
  // return Promise.resolve($.getJSON('api/threads'));
  return new Promise(function (resolve, reject) {
    $.ajax({
    type: 'GET',
    url: 'http://127.0.0.1:8080/getAlbums',
    dataType: 'json',
    success: function (data) {
      var parsedData = $.parseJSON(data);
      console.log('*** parsedData', parsedData);
      resolve(true);
    },
    error: (data) => {
      hideLoadingDialog();
      handleError('couldn\'t load albums', data);
      resolve(false);
    }
    });
  });

  hideLoadingDialog();

  console.log('*** listAlbums8() end');
}

function getData() {
    console.log('*** getData()');

    var deferred = $.Deferred();

    $.ajax({
        'url': 'http://127.0.0.1:8080/getAlbums',
        'dataType': 'json',
        'success': function(data) {
          console.log('getData() data, ', data);
          deferred.resolve(data);
        },
        'error': function(error) {
          console.log('getData() error, ', error);
          deferred.reject(error);
        }
    });

    console.log('*** getData() returning deferred.promise()');

    return deferred.promise();
}

function getData2() {
  console.log('*** getData2 start');

  return new Promise((resolve, reject) => {
    $.ajax({
      'url': 'http://127.0.0.1:8080/getAlbums',
      'dataType': 'json',
      success: function(data) {
        console.log('*** getData2 success, data: ', data);

        resolve(data);
      },
      error: function(error) {
        console.log('*** getData2 error: ', error);

        reject(error);
      }
    })
  });
}

$(document).ready(() => {
  // load list of albums from backend when page is ready
  console.log('*** album.js $(document).ready(() ...');

  // listAlbums();
  // listAlbums2();
  // listAlbums3();
  // listAlbums4();
  // listAlbums5();
  // listAlbums6();
  // listAlbums7();
  // listAlbums8();

  // console.log('*** album.js $(document).ready(() $when()');
  // $.when(getData()).done(function(value) {
  //   console.log('*** $when value: ', value);
  // });
  // console.log('*** album.js $(document).ready(() getData()');
  // getData().then(function(value) {
  //   console.log('getData() call value: ', value);
  // });

  console.log('*** album.js $(document).ready(() getData2()');
  getData2()
  .then(function(data){
    console.log('*** getData2 then(data): ', data);
  })
  .catch(function(error){
    console.log('*** getData2 catch(error): ', error);
  });

  // clicking 'add to frame' btn starts an import request
  $('#albums').on('click', '.album-title', (event) => {
    const target = $(event.currentTarget);
    const albumId = target.attr('data-id');
    const albumTitle = target.attr('data-title');

    console.log('importing album: ', albumTitle);

    loadFromAlbum(albumTitle, albumId);
  });
});