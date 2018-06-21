// empties grid of images
function clearPreview() {
  showPreview(null, null);
}

// shows grid of media items in photo frame
// source is an obj. that describes how items were loaded
// media items are rendered on screen in a grid, with caption-based
// on description, model of camera that took photo and time stamp
// each photo is displayed through fancybox library for full
// screen and caption support
function showPreview(source, mediaItems) {
  $('#images-container').empty();

  // display length & src of item if set
  if (source && mediaItems) {
    $('#images-count').text(mediaItems.length);
    $('#images-source').text(JSON.stringify(source));
    $('#preview-description').show();
  } else {
    $('#images-count').text(0);
    $('#images-source').text('no photo search selected');
    $('#preview-description').hide();
  }

  // show err msg & disable slideshow btn if no items are loaded
  if (!mediaItems || !mediaItems.length) {
    $('#images_empty').show();
    $('#startsSlideshow').prop('disabled', true);
  } else {
    $('#images_empty').hide();
    $('#startsSlideshow').removeClass('disabled');
  }

  // loop over each media item & render it
  $.each(mediaItems, (i, item) => {
    // construct thumbnail URL from item's base URL at small pixel size
    const thumbnailUrl = `${item.baseUrl}=w256-h256`;
    // construct URL to image in its original size based on its width & height
    const fullUrl = 
      `${item.baseUrl}=w${item.mediaMetadata.width}-h${item.mediaMetadata.height}`;

    // compile caption from description, model & time
    const description = item.description ? item.description : '';
    const model = item.mediaMetadata.photo.cameraModel ?
      `#Shot on ${item.mediaMetadata.photo.cameraModel}` : '';
    const time = item.mediaMetadata.creationTime;
    const caption = `${description} ${model} (${time})`

    // each img is wrapped by link for fancybox gallery
    // data-width/data-height attributes are set to the
    // height/width of original image. this allows fancybox library
    // to display a scaled up thumbnail while the full size img
    // is being loaded. the original w/h are part of mediaMetadata
    // of image media item from API
    const linkToFullImage = 
      $('<a />')
      .attr('href', fullUrl)
      .attr('data-fancybox', 'gallery')
      .attr('data-width', item.mediaMetadata.width)
      .attr('data-height', item.mediaMetadata.height);

    // add thumbnail img to link to full img in fancybox
    const thumbnailImage = 
      $('<img />')
      .attr('src', thumbnailUrl)
      .attr('alt', captionText)
      .addClass('img-fluid rounded thumbnail');
    linkToFullImage.append(thumbnailImage);

    // caption consists of caption txt and link to open image in Google Photos
    const imageCaption = 
      $('<figcaption />')
      .addClass('hidden')
      .text(captionText);
    const linkToGooglePhotos =
      $('<a />')
      .attr('href', item.productUrl)
      .text('[Click to open in Google Photos]');
    imageCaption.append($('<br />'));
    imageCaption.append(linkToGooglePhotos);
    linkToFullImage.append(imageCaption);

    // add link (thumbnail & caption to container
    $('#images-container').append(linkToFullImage);
  });
}

// makes backend req. to display the queue of photos currently loaded into
// the photo frame. backedn returns a list of media items that user has selected
// they are rendered in showPreview(...)
function loadQueue() {
  console.log('*** frame.js loadQueue() called, will do axaj to /getQueue');

  showLoadingDialog();
  $.ajax({
    type: 'GET',
    // crossOrigin: true,
    // url: '/getQueue',
    url: 'http://127.0.0.1:8080/getQueue',
    dataType: 'json',
    timeout:  0, // no time out
    // dataType: 'jsonp', // http://127.0.0.1:8080/getQueue?callback=jQuery331032808401843583734_1529455299349&_=1529455299350
    success: (data) => {
      // queue has been loaded. display media items as grid on screen
      hideLoadingDialog();
      showPreview(data.parameters, data.photos);
      hideLoadingDialog();

      console.log('*** frame.js loadQueue, loaded queue');
    },
    error: (data) => {
      hideLoadingDialog();

      console.log('*** frame.js did NOT loaded queue, error: ', JSON.stringify(data));

      handleError('couldn\'t load queue', data);
    }
  });
}

$(document).ready(() => {
  // load queue of photos selected by user for the photo
  console.log('*** frame.js document.ready() ... calling loadQueue()');

  loadQueue();

  // set up fancybox img gallery
  $().fancybox({
    selector: '[data-fancybox="gallery"]',
    loop: true,
    buttons: ['slideshow', 'fullScreen', 'close'],
    image: {preload: true},
    transitionEffect: 'fade',
    transitionDuration: 1000,
    fullScreen: {autoStart: false},
    // automatically advance after 3s to next photo
    slideShow: {autoStart: true, speed: 3000},
    // display contents figcaption element as caption of image
    caption: function(instance, item) {
      return $(this).find('figcaption').html();
    }
  });

  // clicking 'view fullscreen' btn opens gallery from first image
  $('#startSlideshow')
    .on('click', (e) => {
      console.log('startSlideshow btn clicked')
      $('#images-container a').first().click();
  });

  // clicking log our opens log out screen
  $('#logout').on('click', (e) => {
    window.location = '/logout';
  });
});
