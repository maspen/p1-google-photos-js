// submits reg. to load images from search w/ filters.
// entire form is sent to backend where options set here
// are converted into filters & parameters for search req. for the Library API
function importFilter(filter) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:8080/loadFromSearch',
    dataType: 'json',
    data: filter,
    success: (data) => {
      console.log('*** search.js importFilter() loaded photos successfully');

      if (data.photos && data.photos.length > 0) {
        // if reg. was successful and images were loaded, go back to preview screen
        // that shows grid of images queued for display
        console.log('*** search.js importFilter() AFTER search results ... returning to /');

        window.location = '/';
      } else {
        handleError('no images found', 'try different search parameters');
      }
      hideLoadingDialog();
    },
    error: (data) => {
      console.log('*** search.js importFilter() couldn load images, data: ', JSON.stringify(data));

      handleError('couldn\'t load images', data);
    },
  });
}
// trying async ajax
async function asyncAjaxImportFilter(filter) {
  let data;
  try {
    data = await $.ajax({
      type: 'POST',
      url: 'http://127.0.0.1:8080/loadFromSearch',
      dataType: 'json',
      data: filter
    });
    if (data.photos && data.photos.length > 0) {
      // if reg. was successful and images were loaded, go back to preview screen
      // that shows grid of images queued for display
      console.log('*** search.js asyncAjaxImportFilter() AFTER search results, data.photos.length ' + data.photos.length + ' ... returning to /');

      window.location = '/';
    } else {
      handleError('no images found', 'try different search parameters');
    }
    hideLoadingDialog();
  } catch (error) {
    console.log('*** search.js asyncAjaxImportFilter() couldn load images, data: ', JSON.stringify(data));

    handleError('couldn\'t load images', data);
  }
}

function ajaxPromizeImportFilter(filter) {
  $.ajax({
    type: 'POST',
    url: 'http://127.0.0.1:8080/loadFromSearch',
    dataType: 'json',
    data: filter
  })
  .done((data) => {
    if (data.photos && data.photos.length > 0) {
      // if reg. was successful and images were loaded, go back to preview screen
      // that shows grid of images queued for display
      console.log('*** search.js ajaxPromizeImportFilter() AFTER search results data.photos.length ' + data.photos.length + ' ... returning to /');

      window.location = '/';
    } else {
      console.log('*** search.js ajaxPromizeImportFilter() no images found, calling handleError()');

      handleError('no images found', 'try different search parameters');
    }

    hideLoadingDialog();
  })
  .fail((error) => {
    console.log('*** search.js ajaxPromizeImportFilter() couldn load images, error: ', JSON.stringify(error));

    handleError('couldn\'t load images', error);
  });
}

$(document).ready(() => {
  console.log('*** search.js $(document).ready(() ...');
  // show date filter options based on which date filter type selected
  $('input[namme$=\'dateFilter\']').on('click', (e) => {
    const range = '#rowDateRange';
    const exact = '#rowDateExact';

    switch ($(e.currentTarget).val()) {
      case 'none':
        $(range).hide();
        $(exact).hide();
        break;
      case 'exact':
        $(range).hide();
        $(exact).show();
        break;
      case 'range':
        $(range).show();
        $(exact).hide();
        break;
    }
  });

  // when filter form is submitted, serialize contents, show loading dialog
  // & submit req. to backend
  $('#filter').on('submit', (e) => {
    e.preventDefault();
    showLoadingDialog();

    console.log('*** search.js submit() e.target', e.target);
    console.log('*** serializeArray', $(this).serializeArray());
    console.log('*** serialize', $(this).serialize());

    console.log('*** checked length:', $( "input:checked" ).length);
    console.log('*** checked val:', $( "input:checked" ).each(function(){
      // var label = $(this).next();
      return $(this).next();
    }));

    //importFilter($('#filter').serialize())
    // asyncAjaxImportFilter($('#filter').serialize())
    ajaxPromizeImportFilter($('#filter').serialize());
  });
});