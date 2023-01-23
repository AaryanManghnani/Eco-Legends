class WeaponStone extends GameObject{
  constructor(config){
      super(config);
      this.sprite = new Sprite({
          gameObject: this,
          src: "/images/characters/pizza-stone.png",//change this
          animations: {
            "used-down"   : [ [0,0] ],
            "unused-down" : [ [1,0] ],
          },
          currentAnimation: "used-down"
        });
        this.storyFlag = config.storyFlag;
        this.weapons = config.weapons;

        this.talking = [
          {
            required: [this.storyFlag],
            events: [
              { type: "textMessage", text: "You have already used this." },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "Approaching the legendary ECOMON stone..." },
              { type: "craftingMenu", weapons: this.weapons },
              { type: "addStoryFlag", flag: this.storyFlag },
            ]
          }
        ]
  }

  update() {
      this.sprite.currentAnimation = playerState.storyFlags[this.storyFlag]
       ? "used-down"
       : "unused-down";
     }
}