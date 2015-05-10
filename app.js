var cards = {};
var currentClass;
var currentDeck =[];
var lastInput="";

function setClass(playerClass) {
  currentClass = playerClass;
  $('span.class-name').text(playerClass);
  genCardList($('#class-card-list'), cards.collectible[playerClass], false);
  genCardList($('#neutral-card-list'), cards.collectible[null], false);
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
    $('#srch-term').focus().select();
  });
  $('#class-select ul li a').click(function() {
    setClass($(this).data().class)
    clearDeck();
    $('#class-select').hide();
    $('#deck-builder').show();
  });
  $(window).on('scroll',onScroll);
  $('#tab-class a').click(function() {
    $(window).scrollTop(Math.floor($('#card-list').offset().top));
    onScroll();
  });
  $('#tab-neutral a').click(function() {
    var offset=0;
    if ($(window).scrollTop() >= Math.floor($('#card-list').offset().top)) {
      var offset=$('#neutral-label').outerHeight(true);
    }
    $(window).scrollTop(Math.floor(Math.floor($('#neutral-label').offset().top+offset-$('#card-list-header').height())));
    onScroll();
  });
  setInterval(function() { observeInputValue($('#srch-term').val()); }, 100);
  $('#search-clear').click(function() {
    $('#srch-term').val('');
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

function genCardList(element, list, isDeck) {
  var count = 1;
  var previous;
  var curve = {0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0};
  element.empty();
  $('.in-deck-count').hide();
  $.each(list, function(cardIndex, card) {
    if (previous===card) {
      count++;
      curve[getManaSlot(card.cost)]++;
      element.children().last().text(card.name+" x"+count);
      $('#'+card.id+' .in-deck-count').show().text(count + ' in deck');
    } else {
      count=1;
      previous=card;
      button=$('<button>')//, {class: 'span-4 well', href: 'javascript:void(0);'})
        .click(function() {
          if (isDeck) {
            removeCardFromDeck(cardIndex);
          } else {
            addCardToDeck(card);
          }
        })
        .addClass('btn').addClass('btn-link');
      if (isDeck){
        button.addClass('deck-item');
        button.text(card.name);
        $('#'+card.id+' .in-deck-count').show().text(count + ' in deck');
        curve[getManaSlot(card.cost)]++;
      } else {
        button.bind('contextmenu', function(e) {
          var which=-1;
          e.preventDefault();
          $.each(currentDeck, function (cardIndex, deckCard) {
            if (deckCard.id == card.id) {
              which=cardIndex;
              return false; //exit the each loop
            }
          });
          if (which > -1) {
            removeCardFromDeck(which);
          }
        });
        button.append('<img class="img-responsive" src="http://wow.zamimg.com/images/hearthstone/cards/enus/original/'+card.id+'.png">');
        button.addClass('col-lg-2').addClass('col-md-3').addClass('col-sm-4');
        button.append($('<div>').addClass('in-deck-count'));
        button=$('<div id="'+card.id+'">').addClass('row-fluid').addClass('available-item').append(button);
      }
      element.append(button);
    }
    });
  displayCurve(curve);
}

function refreshDeck() {
  var count=currentDeck.length;
  $('#deck-list ul').empty();
  sortCards(currentDeck);
  $('span.deck-count').text(count?count:'');
  updateSaveLink();
  genCardList($('#deck-list'), currentDeck, true);
}

function addCardToDeck(card) {
  var limit=(card.rarity=="Legendary"?1:2);
  if (countDups(currentDeck, card)<limit && currentDeck.length<30) {
    currentDeck.push(card);
  }
  refreshDeck();
}

function removeCardFromDeck(index) {
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

function onScroll() {
  var scrollTop=$(window).scrollTop();
  if (scrollTop >= Math.floor($('#card-list').offset().top)) {
    if (!$('#deck-area').hasClass('fixed')) {
      $('#deck-area').addClass('fixed');
      $('#card-list-header').addClass('fixed').addClass('col-xs-6').addClass('col-sm-8').addClass('col-lg-10');
      $('.card-list-section').first().css('padding-top',$('#card-list-header').height()+'px');
    }
    if (scrollTop >= Math.floor($('#neutral-label').offset().top+$('#neutral-label').outerHeight(true)-$('#card-list-header').height())) {
      $('#neutral-header').show();
      $('#class-header').hide();
      $('#tab-neutral').addClass('active');
      $('#tab-class').removeClass('active');
    } else {
      $('#class-header').show();
      $('#neutral-header').hide();
      $('#tab-class').addClass('active');
      $('#tab-neutral').removeClass('active');
    }
  } else {
    if ($('#deck-area').hasClass('fixed')) {
      $('.card-list-section').first().css('padding-top','');
      $('#deck-area').removeClass('fixed');
      $('#card-list-header').removeClass('fixed').removeClass('col-xs-6').removeClass('col-sm-8').removeClass('col-lg-10');
      $('#neutral-header').hide();
      $('#class-header').hide();
    }
  }
}
function observeInputValue(value) {
  if (value!=lastInput) {
    search(value);
  }
  lastInput=value;
}
function search(value) {
  var hasResults=false;
  if (value=='') {
    $('.available-item').show();
    $('#search-clear').hide();
    $('#class-label').show();
    $('#neutral-label').show();
    $('#no-results').hide();
    return;
  }
  $('#search-clear').show();
  words=value.toLowerCase().split(' ');
  $('.available-item').hide();
  if (searchClass(cards.collectible[currentClass], words) == 0) {
      $('#class-label').hide();
  } else {
      hasResults = true;
      $('#class-label').show();
  }
  if (searchClass(cards.collectible[null], words) == 0) {
      $('#neutral-label').hide();
  } else {
      hasResults = true;
      $('#neutral-label').show();
  }
  if (hasResults) {
    $('#no-results').hide();
  } else {
    $('#no-results').show();
  }
}

function searchClass(cardList, words) {
  var count=0;
  $.each(cardList, function (cardIndex, card) {
    if (words.every(function (word) {
      return [card.name,card.text,card.race,card.rarity,card.type].some( function (parameter) {
        return (parameter || '').toLowerCase().indexOf(word) > -1;
      });
    })) {
      $('#'+card.id).show();
      count++;
    }
  });
  return count;
}

function displayCurve(curve) {
  var max=0;
  $.each(curve, function (cost, count) {
    if (count>max) {
      max=count;
    }
  });
  $.each(curve, function (cost, count) {
    var id='#mana-'+cost;
    $(id+' .bar-count').text(count);
    $(id+' div div').css('padding-bottom',(max && count/max*350)+'%'); //bar is 0 height if max is 0;
  });
}

function getManaSlot(cost) {
  if (cost >= 7) {
    return 7;
  }
  return cost;
}

//can be called from console to make right click menu work on cards again.
function enableDebuging() {
  $('.available-item button').unbind('contextmenu');
}
