var cards = {}

function init() {
  $('#loading-indicator').show();
  $.getJSON("http://hearthstonejson.com/json/AllSets.json", function(data) {
    cards = data;
    showUI();
  })
}

function showUI() {
  $('#loading-indicator').hide();
}
