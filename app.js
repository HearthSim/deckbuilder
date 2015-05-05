var cards = {};
var currentClass;
var currentDeck =[];

function setClass(playerClass) {
  currentClass = playerClass;
  $('span.class-name').text(playerClass);
  genCardList($('#class-card-list ul'), cards.collectible[playerClass], addCardToDeck);
  genCardList($('#neutral-card-list ul'), cards.collectible[null], addCardToDeck);
}

$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});

function init() {
  $('#loading-indicator').show();
  $.getJSON('http://hearthstonejson.com/json/AllSets.json', function(data) {
    cards = parseData(data);
    var urlVars=$.getUrlVars();
    console.log(urlVars);
    if ('cards' in urlVars) {
      if (loadDeck(urlVars)) {
        $('#class-select').hide();
        $('#deck-builder').show();
        refreshDeck();
      }
    }
    $('#loading-indicator').hide();
    console.log('cards: %o', cards);
  });
  $('#act-new-deck').click(function() {
    $('#deck-builder').hide();
    $('#class-select').show();
  });
  $('#class-select ul li a').click(function() {
    setClass($(this).data().class)
    clearDeck();
    $('#class-select').hide();
    $('#deck-builder').show();
  });
}

function loadDeck(urlVars) {
  var curIndex=0,nextIndex;
  var cardString,id;
  var card;
  try {
    setClass(urlVars['class']);
  } catch(err) {
    return false;
  }
  cardString=urlVars['cards'];
  while (curIndex<cardString.length) {
    nextIndex=cardString.indexOf('_',curIndex)+4;
    id=cardString.slice(curIndex,nextIndex);
    curIndex=nextIndex;
    card = cards['byid'][id];
    if (card) {
      currentDeck.push(card);
    }
  }
  return true;
}

function parseData(data) {
  var result = {byCollection:data};
  var collectible={};
  var byid={};
  $.each(data, function(collectionName,collection) {
    $.each(collection, function(cardIndex,card) {
      //if (card.hasOwnProperty('collectible') && card['collectible']) {
      if (card['collectible'] && card['type']!="Hero") {
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
        byid[card.id]=card;
      }
    });
  });
  $.each(collectible, function(playerClass, cards) {
    sortCards(cards);
  });
  result['collectible']=collectible;
  result['byid']=byid;
  return result;
}

function genCardList(element, list, handler) {
  var count=1;
  var previous;
  element.empty();
  $.each(list, function(cardIndex, card) {
    if (previous===card) {
      count++;
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
  var count=currentDeck.length;
  $('#deck-list ul').empty();
  sortCards(currentDeck);
  $('span.deck-count').text(count?count:'');
  updateSaveLink();
  genCardList($('#deck-list ul'), currentDeck, removeCardFromDeck);
}

function addCardToDeck(index, card) {
  var limit=(card.rarity=="Legendary"?1:2);
  if (countDups(currentDeck, card)<limit && currentDeck.length<30) {
    currentDeck.push(card);
  }
  refreshDeck();
}

function removeCardFromDeck(index, card) {
  currentDeck.splice(index, 1);
  refreshDeck();
}

function countDups(list, card) {
  var count=0;
  $.each(list, function(cardIndex, curCard) {
    if (curCard===card) {
      count++;
    }
  });
  return count;
}

function clearDeck() {
  currentDeck=[];
  refreshDeck();
}

function updateSaveLink() {
  var cards='';
  $.each(currentDeck, function(cardIndex, card) {
    cards+=card.id;
  });
  $('#act-save-deck').attr('href','?cards='+cards+'&class='+currentClass);
}

function encodeCards(list) {
  $.each(list, function(cardIndex, card) {
    var id,prefix,number;
    id=card.id.toUpperCase();
  });
}

function decodeCards(val) {
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

