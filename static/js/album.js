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
      console.log('*** albums.js loadFromAlbum(), imported:' + JSON.stringify(data.parameters));

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

function getAlbumsAjax() {
  console.log('*** getAlbumsAjax() start');

  hideError();
  showLoadingDialog();
  $('#albums').empty();

  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'GET', // default
      'url': 'http://127.0.0.1:8080/getAlbums',
      'dataType': 'json',
      timeout: 0, // no time out - allows for index.js. /getAlbums to complete, else get errors in console
      success: function(data) {
        console.log('*** getAlbumsAjax() success, data: ', data);

        resolve(data);
      },
      error: function(error) {
        console.log('*** getAlbumsAjax() error: ', error);

        reject(error);
      }
    })
  });
}

function displayAlbums(data) {
  console.log('Loaded albums: ' + data.albums);
      // Render each album from the backend in its own row, consisting of
      // title, cover image, number of items, link to Google Photos and a
      // button to add it to the photo frame.
      // The items rendered here are albums that are returned from the
      // Library API.
      $.each(data.albums, (i, item) => {
        // Load the cover photo as a 100x100px thumbnail.
        // It is a base url, so the height and width parameter must be appened.
        const thumbnailUrl = `${item.coverPhotoBaseUrl}=w100-h100`;

        // Set up a Material Design Lite list.
        const materialDesignLiteList =
            $('<li />').addClass('mdl-list__item mdl-list__item--two-line');

        // Create the primary content for this list item.
        const primaryContentRoot =
            $('<div />').addClass('mdl-list__item-primary-content');
        materialDesignLiteList.append(primaryContentRoot);

        // The image showing the album thumbnail.
        const primaryContentImage = $('<img />')
                                        .attr('src', thumbnailUrl)
                                        .attr('alt', item.title)
                                        .addClass('mdl-list__item-avatar');
        primaryContentRoot.append(primaryContentImage);

        // The title of the album as the primary title of this item.
        const primaryContentTitle = $('<div />').text(item.title);
        primaryContentRoot.append(primaryContentTitle);

        // The number of items in this album as the sub title.
        const primaryContentSubTitle =
            $('<div />')
                .text(`(${item.totalMediaItems} items)`)
                .addClass('mdl-list__item-sub-title');
        primaryContentRoot.append(primaryContentSubTitle);

        // Secondary content consists of two links with buttons.
        const secondaryContentRoot =
            $('<div />').addClass('mdl-list__item-secondary-action');
        materialDesignLiteList.append(secondaryContentRoot);


        // The 'add to photo frame' link.
        const linkToAddToPhotoFrame = $('<a />')
                                          .addClass('album-title')
                                          .attr('data-id', item.id)
                                          .attr('data-title', item.title);
        secondaryContentRoot.append(linkToAddToPhotoFrame);


        // The button for the 'add to photo frame' link.
        const addToPhotoFrameButton =
            $('<button />')
                .addClass(
                    'mdl-button mdl-js-button mdl-button--raised mdl-button--accent')
                .text('Add to frame');
        linkToAddToPhotoFrame.append(addToPhotoFrameButton);

        // The 'open in Google Photos' link.
        const linkToGooglePhotos =
            $('<a />').attr('target', '_blank').attr('href', item.productUrl);
        secondaryContentRoot.append(linkToGooglePhotos);

        // The button for the 'open in Google Photos' link.
        const googlePhotosButton = $('<button />')
                                       .addClass('gp-button raised')
                                       .text('Open in Google Photos');
        linkToGooglePhotos.append(googlePhotosButton);

        // Add the list item to the list of albums.
        $('#albums').append(materialDesignLiteList);
      });

      hideLoadingDialog();
      console.log('Albums loaded.');
}

$(document).ready(() => {
  // load list of albums from backend when page is ready

  console.log('*** album.js $(document).ready(() getAlbumsAjax()');
  getAlbumsAjax()
  .then(function(data){
    console.log('*** getAlbumsAjax then(data): ', data);

    displayAlbums(data);
  })
  .catch(function(error){
    console.log('*** getAlbumsAjax catch(error): ', error);

    hideLoadingDialog();
    handleError('Couldn\'t load albums', data);
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