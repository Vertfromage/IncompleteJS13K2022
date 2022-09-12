'use strict'

class GameObject extends EngineObject 
{
    constructor(pos, size, tileIndex, tileSize, angle)
    {
        super(pos, size, tileIndex, tileSize, angle)
        this.health = 0
        this.isGameObject = 1
        this.damageTimer = new Timer
    }

    update()
    {
        super.update()
    }

    isDead()                { return !this.health}
}

class Character extends GameObject 
{
    constructor(pos)
    { 
        super(pos, vec2(.6,.95), 32)

        this.drawSize = vec2(1)
        this.color = (new Color).setHSLA(rand(),1,.7)
        this.renderOrder = 10
        this.walkCyclePercent = 0
        this.health = 1
        this.moveInput = 0
        this.setCollision(1)
    }
    
    update() 
    {

        if (this.isDead())
            return super.update()

        const moveInput = this.moveInput.copy()
        
        // apply movement acceleration and clamp
        const maxCharacterSpeed = .05;
        this.velocity.x = clamp(this.velocity.x + moveInput.x * .042, -maxCharacterSpeed, maxCharacterSpeed)
        this.velocity.y = clamp(this.velocity.y + moveInput.y * .042, -maxCharacterSpeed, maxCharacterSpeed)

        // track last pos for ladder collision code
        this.lastPos = this.pos.copy()

        // call parent and update physics
        super.update()

        // update mirror
        if (moveInput.x)
            this.mirror = moveInput.x < 0
        
    }
       
    render()
    {
        let bodyPos = this.pos;
        if (!this.isDead())
        {
            // bounce pos with walk cycle
            bodyPos = bodyPos.add(vec2(0,.05*Math.sin(this.walkCyclePercent*PI)))

            // make bottom flush
            bodyPos = bodyPos.add(vec2(0,(this.drawSize.y-this.size.y)/2))
        }
        drawTile(bodyPos, this.drawSize, this.tileIndex, this.tileSize, this.color, this.angle, this.mirror)
    }

      
    collideWithTile(data, pos)
    {
        if (!data)
            return

        return 1
    }
}

///////////////////////////////////////////////////////////////////////////////

class Player extends Character
{
    update() 
    {
        // movement control
        this.moveInput = isUsingGamepad ? gamepadStick(0) : 
            vec2(keyIsDown(39) - keyIsDown(37), keyIsDown(38) - keyIsDown(40))

        super.update()
    }
}

class Opponent extends Character
{
    constructor(pos){
        super(pos)
        this.stepX = 0
        this.stepY = 0
        this.goal = vec2(1,1)
    }
    
    update() 
    {
        // movement control
        this.moveInput = vec2(this.stepX,this.stepY)

        super.update()
    }

    move(x,y){
        this.stepX=x
        this.stepY=y
    }

    newGoal(){
        this.goal = vec2(randInt(1,31), randInt(1,14))
    }

    collideWithTile(data, pos)
    {
        if (!data)
        return;
    }
}