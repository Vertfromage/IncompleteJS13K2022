/*
    LittleJS Hello World Starter Game
*/

'use strict';

// popup errors if there are any (help diagnose issues on mobile devices)
if (debug)
    onerror = (...parameters)=> alert(parameters);

// game variables
let fire, clickCount = 0, player, playerStartPos, levelColor, tileBackground, tileBackgroundLayer, tileLayer
, previousPos, waterSprite, water, speech, text
let voices
const setTileBackgroundData = (pos, data=0)=>
    pos.arrayCheck(tileCollisionSize) && (tileBackground[(pos.y|0)*tileCollisionSize.x+pos.x|0] = data);
const getTileBackgroundData = (pos)=>
    pos.arrayCheck(tileCollisionSize) ? tileBackground[(pos.y|0)*tileCollisionSize.x+pos.x|0] : 0;

    const center = tileCollisionSize.scale(.5).add(vec2(0,9));
///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // create tile collision and visible tile layer
    initTileCollision(vec2(32,16));
    const pos = vec2();
    tileLayer = new TileLayer(vec2(),tileCollisionSize);
    tileLayer.renderOrder = -1e3;
    tileBackgroundLayer = new TileLayer(vec2(), tileCollisionSize);
    tileBackgroundLayer.renderOrder = -2e3;
    tileBackground = [];
    text = ["So hot tonight", "fire, fire baby", "burning it all down"]
    
    levelColor = randColor(new Color(.2,.2,.2), new Color(.8,.8,.8))

    // maybe make 3 speech utterances in an array, would work better.
    speech = new SpeechSynthesisUtterance();
    speech.lang = "en"

    

    // get level data from the tiles image
    const imageLevelDataRow = 1;
    mainContext.drawImage(tileImage,0,0);
    for (pos.x = tileCollisionSize.x; pos.x--;)
    for (pos.y = tileCollisionSize.y; pos.y--;)
    {
        const data = mainContext.getImageData(pos.x, 16*(imageLevelDataRow+1)-pos.y-1, 1, 1).data;
        //console.log(data)
        if (data[0])
        {
            setTileCollisionData(pos, 1)

            const tileIndex = 1
            const direction = randInt(4)
            const mirror = randInt(2)
            const color = randColor()
            const data = new TileLayerData(tileIndex, direction, mirror, color)
            tileLayer.setData(pos, data)
        }else{
            setTileCollisionData(pos, 0)
        }
        const backData = new TileLayerData(3, randInt(4), randInt(2), levelColor.mutate().scale(.4,1));
        backData.dead = false
        tileBackgroundLayer.setData(pos,backData)
    }
    
   
    tileLayer.redraw()
    tileBackgroundLayer.redraw()

    // move camera to center of collision
    cameraPos = tileCollisionSize.scale(.5);
    cameraScale = 32*2;
    
    fire = newFire()
    water = newWater()

    playerStartPos = cameraPos
    player = new Player(playerStartPos);
    player.tileSize = vec2(16);
    player.tileIndex=2;// spawn player
    player.color = new Color(1,0,0)

    waterSprite = new Opponent(vec2(1,1));
    waterSprite.tileSize = vec2(16);
    waterSprite.tileIndex=2;// spawn player
    waterSprite.color = new Color(0,0,1)
    
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // light grass on fire
    let curr =  tileBackgroundLayer.getData(player.pos)
    let temp
    if(!curr.dead&&!curr.wet){
        curr.color = randColor(new Color(1,0,.5), new Color(1,0,0))
        curr.tile = 4
        curr.dead = true
    }else if(curr.wet){
        curr.dead = true
        curr.color = randColor()
    }


        let once = 0
        // surrounding foilage
        for(let i=-1;i<2;i++){
        for(let j=-1;j<2;j++){
            temp = tileLayer.getData(vec2(player.pos.x+i, player.pos.y+j))
            if(temp.tile){
                curr = tileBackgroundLayer.getData(vec2(player.pos.x+i, player.pos.y+j))
                if(!curr.wet && !curr.dead){
                    curr.color = randColor(new Color(1,0,.5), new Color(1,0,0))
                    temp.color = randColor(new Color(0,0,0), new Color(1,0,0))
                    curr.tile = 4
                    curr.dead = true
                    if(!once){
                        window.speechSynthesis.speak(speech)
                            // switch up tone
                        speech.volume= rand(0.2,0.8)
                        speech.pitch = rand(3,6)
                        speech.rate = rand(0.5,2)
                        speech.text = text[randInt(0,3)]
                        once = 1
                    }
                }else if(curr.wet){
                    curr.dead = true
                    curr.color = randColor()
                }
            }
        }}

        tileBackgroundLayer.redraw()
        tileLayer.redraw()
    

    moveWaterImp(waterSprite)

    // mouse wheel = zoom
    cameraScale = clamp(cameraScale*(1-mouseWheel/10), 1, 1e3);

    cameraPos = player.pos
    fire.pos = player.pos
    water.pos = waterSprite.pos
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{

}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // draw to overlay canvas for hud rendering
    const drawText = (text, x, y, size=50) =>
    {
        overlayContext.textAlign = 'center'
        overlayContext.textBaseline = 'top'
        overlayContext.font = size + 'px arial'
        overlayContext.fillStyle = '#fff'
        overlayContext.lineWidth = 2
        overlayContext.strokeText(text, x, y)
        overlayContext.fillText(text, x, y)
    }
    drawText("Player: "+player.pos, overlayCanvas.width*1/2,0, 10)
    //drawText("Background: "+ getTileBackgroundData(player.pos), overlayCanvas.width*1/2, 30,10)
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, 'tiles.png')


function moveWaterImp(sprite){
    let curr =  tileBackgroundLayer.getData(sprite.pos)
    let temp = tileLayer.getData(sprite.pos)
        if(curr.dead){
            curr.color = randColor(new Color(0,.5,1), new Color(0,0,1))
            curr.tile = 4
            tileBackgroundLayer.redraw()
            curr.dead = false
            curr.wet = true
            if(temp.tile){
                temp.color = randColor()
                tileLayer.redraw()
            }
        }
        let moveX=0
        let moveY=0
        let goal = sprite.goal
        let pos = sprite.pos.floor()
        if(pos.x!=goal.x || pos.y!=goal.y){
            //console.log("not at goal")
            if(pos.x<goal.x){
                moveX = 1
            }else if(pos.x>goal.x){
                moveX = -1
            }
            if(pos.y<goal.y){
                moveY = 1
            }else if(pos.y>goal.y){
                moveY = -1
            }
            sprite.move(moveX,moveY)
        }else{
            console.log("newGoal")
            sprite.newGoal()
            sprite.move(0,0)
        }
}

function newFire(){
    return new ParticleEmitter(
        center, .3, 1, 0, 500, PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
        0, vec2(20),                            // tileIndex, tileSize
        new Color(1,0,0),   new Color(1,1,1),   // colorStartA, colorStartB
        new Color(1,0,0,0), new Color(0,0,0,0), // colorEndA, colorEndB
        .5, .3, .2, .002, .05,     // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
        .99, 1, 1, PI, .3,     // damping, angleDamping, gravityScale, particleCone, fadeRate, 
        .5, 1, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    )
}

function newWater(){
    return new ParticleEmitter(
        center, .3, 1, 0, 500, PI, // pos, angle, emitSize, emitTime, emitRate, emiteCone
        0, vec2(20),                            // tileIndex, tileSize
        new Color(0,0,1),   new Color(1,1,1),   // colorStartA, colorStartB
        new Color(0,0,1,0), new Color(0,0,0,0), // colorEndA, colorEndB
        .5, .3, .2, .002, .05,     // particleTime, sizeStart, sizeEnd, particleSpeed, particleAngleSpeed
        .99, 1, 1, PI, .3,     // damping, angleDamping, gravityScale, particleCone, fadeRate, 
        .5, 1, 1                // randomness, collide, additive, randomColorLinear, renderOrder
    )
}
