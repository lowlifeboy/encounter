var Overlay = {};

Overlay.text = null; // current text in readout

Overlay.init = function()
{
  Overlay.initDivs();
  Overlay.initTouch();
}

Overlay.initDivs = function()
{
  // just set width or height if we can
  var container = document.createElement('div');
  container.id = 'overlay';
    
  container.style.cssText = '/* width:100px; */ /* height:50px; */ opacity:0.5; cursor:pointer';

  // textBox adds padding, alignment, background
  var textBox = document.createElement('div');
  textBox.id = 'textBox';
  // padding order: top right bottom left
  // TODO gradient needs multiple declarations to work in all browsers, as per stats.js/examples/theming.html
  textBox.style.cssText = 'padding:0px 5px 0px 5px; text-align:left; background-color:#000; background-image:-webkit-linear-gradient(top, rgba(255,255,255,.4) 0%, rgba(0,0,0,.35) 100%)';
  container.appendChild(textBox);

  // text is the content
  Overlay.text = document.createElement('div');
  Overlay.text.id = 'text';
  Overlay.text.style.cssText = 'color:#0ff; font-family:Helvetica,Arial,sans-serif; font-size:36px; font-weight:bold; /* line-height:18px */';
  textBox.appendChild(Overlay.text);

  // place the overlay in the page
  container.style.position = 'absolute';
  container.style.top = '0px';
  document.body.appendChild(container);
}

Overlay.initTouch = function()
{
  // let phone users start the game
  document.addEventListener('touchstart', function (event) {
    event.preventDefault();
    Keys.shooting = true;
  }, false);
  document.addEventListener('touchend', function (event) {
    event.preventDefault();
    Keys.shooting = false;
  }, false);
}

Overlay.update = function()
{
  switch (State.current)
  {
    case State.ATTRACT:
      Overlay.text.innerHTML = 'PRESS SPACE TO BEGIN';
      break;
    case State.COMBAT:
    case State.WAIT_FOR_ENEMY:
    case State.WAIT_FOR_PORTAL:
      // TODO Player.livesLeft
      Overlay.text.innerHTML = 'W' + State.worldNumber + ' E' + State.enemiesRemaining;
      break;
    default:
      console.error('unknown state: ', State.current);
  }
}