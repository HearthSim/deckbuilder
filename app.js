var cards = {};
var currentClass;
var currentDeck =[];

function setClass(playerClass) {
  currentClass = playerClass;
  $('span.class-name').text(playerClass);
  genCardList($('#class-card-list ul'), cards.collectible[playerClass], addCardToDeck);
  genCardList($('#neutral-card-list ul'), cards.collectible[null], addCardToDeck);
}

function init() {
  $('#loading-indicator').show();
  $.getJSON('http://hearthstonejson.com/json/AllSets.json', function(data) {
    cards = parseData(data);
    $('#loading-indicator').hide();
    console.log('cards: %o', cards);
  });
  $('#act-new-deck').click(function() {
    $('#deck-builder').hide();
    clearDeck();
    $('#class-select').show();
  });
  $('#class-select ul li a').click(function() {
    setClass($(this).data().class)
    $('#class-select').hide();
    $('#deck-builder').show();
  });
}

function parseData(data) {
  var result = {byCollection:data};
  var collectible={};
  $.each(data, function(collectionName,collection) {
    $.each(collection, function(cardIndex,card) {
      //if (card.hasOwnProperty('collectible') && card['collectible']) {
      if (card['collectible']) {
        card['collection']=collectionName;
        var playerClass;
        if (card.hasOwnProperty('playerClass')) {
          playerClass=card.playerClass;
        } else {
          playerClass=null;
        }

        if (!collectible.hasOwnProperty(playerClass)) {
          collectible[playerClass]=[];
        }
        collectible[playerClass].push(card);
      }
    });
  });
  $.each(collectible, function(playerClass, cards) {
    sortCards(cards);
  });
  result['collectible']=collectible;
  return result;
}

function genCardList(element, list, handler) {
  var count=1;
  var previous;
  element.empty();
  $.each(list, function(cardIndex, card) {
    if (previous===card) {
      count+=1;
      element.children().last().children().last().text(card.name+" x"+count);
    } else {
      count=1;
      previous=card;
      element.append(
          $('<li>').append(
            $('<a>', {href: 'javascript:void(0);'}).text(card.name).click(function() {
              handler(cardIndex, card);
            })
            ));
    }
    });
}

function refreshDeck() {
  var count=1;
  $('#deck-list ul').empty();
  sortCards(currentDeck);
  genCardList($('#deck-list ul'), currentDeck, removeCardFromDeck);
}

function addCardToDeck(index, card) {
  currentDeck.push(card);
  refreshDeck();
}

function removeCardFromDeck(index, card) {
  currentDeck.splice(index, 1);
  refreshDeck();
}

function clearDeck() {
  currentDeck=[];
  refreshDeck();
}

function sortCards(list) {
  list.sort(compareCards);
}

function compareCards(a,b) {
  if (a.cost != b.cost) {
    return a.cost-b.cost;
  }
  if (a.type != b.type) {
    if (a.type == "Weapon") {
      return -1;
    }
    if (a.type == "Minion") {
      return 1;
    }
    if (b.type == "Weapon") {
      return 1;
    }
    if (b.type == "Minion") {
      return -1;
    }
  }
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

