'use strict';

var State = {};

State.ATTRACT = 'attract';
State.WAIT_FOR_ENEMY = 'waitForEnemy';
State.COMBAT = 'combat';
State.WAIT_FOR_PORTAL = 'waitForPortal';
State.WARP = 'warp';
State.PLAYER_HIT = 'playerHit';
State.GAME_OVER = 'gameOver';
State.current = null;

State.actors = [];

State.enemiesRemaining = null;

State.isPaused = false;

// called once at startup. Go into our first state
State.init = function()
{
  Attract.init();
  Grid.init();  // reads the camera draw distance and sizes the Grid.viewport
  Ground.init();
  Sound.init();
  Overlay.init();
  Player.init();
  Missile.init();
  Saucer.init();
  SaucerSingle.init();
  SaucerTriple.init();
  SaucerChaingun.init();
  SaucerShotgun.init();
  SaucerAutoShotgun.init();
  Camera.init();
  Controls.init();
  Touch.init(); // FIXME depends on Controls.init
  Radar.init();
  Portal.init();
  Warp.init();
  GUI.init(); // depends on Controls.init
  Indicators.init();
  Explode.init();
  Level.init();

  State.setupAttract();
};

// Setup a new combat level, either on game start or moving out of warp.
// Level number is optional; by default rely on the state in Level.
State.initLevel = function(levelNumber)
{
  if (typeof levelNumber !== 'undefined')
  {
    Level.set(levelNumber);
  }

  log('initialising level ' + Level.number);
  Overlay.setSkyColour(Level.current.backgroundColor);
  Overlay.setHorizonColour(Level.current.horizonColor);

  Camera.useFirstPersonMode();
  Controls.useEncounterControls();
  Player.resetPosition();
  Player.resetShieldsLeft();
  Grid.reset();
  Enemy.reset();
  Indicators.reset();
  State.resetActors();

  State.resetEnemyCounter();
};

State.resetActors = function()
{
  while (State.actors.length > 0)
  {
    var actor = State.actors.pop();
    scene.remove(actor);
  }
};

State.resetEnemyCounter = function()
{
  State.enemiesRemaining = Level.current.enemyCount;
};

State.setupAttract = function()
{
  State.current = State.ATTRACT;
  log('State: ' + State.current);
  Attract.show();
};

State.setupWaitForEnemy = function()
{
  State.current = State.WAIT_FOR_ENEMY;
  log('State: ' + State.current);

  Overlay.update();
  Enemy.startSpawnTimer();
};

State.setupWaitForPortal = function()
{
  State.current = State.WAIT_FOR_PORTAL;
  log('State: ' + State.current);

  Overlay.update();
  Portal.startSpawnTimer();
};

State.setupCombat = function()
{
  State.current = State.COMBAT;
  log('State: ' + State.current);
};

State.setupPlayerHitInCombat = function()
{
  State.current = State.PLAYER_HIT;
  log('State: ' + State.current);
  if (Player.shieldsLeft < 0)
  {
    State.setupGameOver();
  }
};

State.setupGameOver = function()
{
  State.current = State.GAME_OVER;
  log('State: ' + State.current);
  Overlay.setText('GAME OVER');
};

State.setupWarp = function()
{
  State.current = State.WARP;
  log('State: ' + State.current);

  Warp.setup();
};

State.enemyKilled = function()
{
  log('enemy destroyed');
  State.enemiesRemaining -= 1;
  if (State.enemiesRemaining > 0)
  {
    State.setupWaitForEnemy();
  }
  else
  {
    State.setupWaitForPortal();
  }
};

State.updateWaitForEnemy = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);
  Grid.update();

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Enemy.spawnIfReady();
  Radar.update();
};

State.updateWaitForPortal = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);
  Grid.update();

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Portal.update(timeDeltaMillis);
  Radar.update();
  TWEEN.update();
};

State.updateCombat = function(timeDeltaMillis)
{
  Controls.current.update(timeDeltaMillis);
  Player.update(timeDeltaMillis);
  Camera.update(timeDeltaMillis);
  Grid.update();

  // update non-Player game State.actors
  if (!State.isPaused)
  {
    State.updateActors(timeDeltaMillis);
    Controls.interpretKeys(timeDeltaMillis);
  }

  Radar.update();
  Indicators.update(); // needed for flickering effects only
};

State.updatePlayerHitInCombat = function(timeDeltaMillis)
{
  if (Keys.shooting && clock.oldTime > (Player.timeOfDeath + Encounter.PLAYER_DEATH_TIMEOUT_MS))
  {
    Keys.shooting = false;
    Indicators.reset();
    State.resetActors();
    Player.isAlive = true;
    State.setupWaitForEnemy();
  } 
};

State.updateGameOver = function(timeDeltaMillis)
{
  if (Keys.shooting && clock.oldTime > (Player.timeOfDeath + Encounter.PLAYER_DEATH_TIMEOUT_MS))
  {
    Keys.shooting = false;
    Level.reset();
    State.setupAttract();
  }
};

// ask all State.actors to update their state based on the last time delta
State.updateActors = function(timeDeltaMillis)
{
  for (var i = 0; i < State.actors.length; i++) {
    State.actors[i].update(timeDeltaMillis);
  }
};

// called from util.js
function update(timeDeltaMillis)
{
  switch (State.current)
  {
    case State.ATTRACT:
      Attract.update(timeDeltaMillis);
      break;
    case State.COMBAT:
      State.updateCombat(timeDeltaMillis);
      break;
    case State.WAIT_FOR_PORTAL:
      State.updateWaitForPortal(timeDeltaMillis);
      break;
    case State.WAIT_FOR_ENEMY:
      State.updateWaitForEnemy(timeDeltaMillis);
      break;
    case State.WARP:
      Warp.update(timeDeltaMillis);
      break;
    case State.PLAYER_HIT:
      State.updatePlayerHitInCombat(timeDeltaMillis);
      break;
    case State.GAME_OVER:
      State.updateGameOver(timeDeltaMillis);
      break;
    default:
      console.error('unknown state: ', State.current);
  }
}

State.actorIsDead = function(actor)
{
  if (typeof actor === 'undefined')
  {
    throw('actor undefined');
  }

  var index = State.actors.indexOf(actor);
  if (index !== -1) {
    State.actors.splice(index, 1);
  }

  scene.remove(actor);
};