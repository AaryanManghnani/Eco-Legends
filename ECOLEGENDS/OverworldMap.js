class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = {}; // Live objects are in here
    this.configObjects = config.configObjects; // Configuration content

    
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;
    this.isPaused = false;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
      )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
    )
  } 

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    if (this.walls[`${x},${y}`]) {
      return true;
    }
    //Check for game objects at this position
    return Object.values(this.gameObjects).find(obj => {
      if (obj.x === x && obj.y === y) { return true; }
      if (obj.intentPosition && obj.intentPosition[0] === x && obj.intentPosition[1] === y ) {
        return true;
      }
      return false;
    })

  }

  mountObjects() {
    Object.keys(this.configObjects).forEach(key => {

      let object = this.configObjects[key];
      object.id = key;

      let instance;
      if (object.type === "Person") {
        instance = new Person(object);
      }
      if (object.type === "WeaponStone") {
        instance = new WeaponStone(object);
      }
      this.gameObjects[key] = instance;
      this.gameObjects[key].id = key;
      instance.mount(this);
    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
        break;
      }
    }
    this.isCutscenePlaying = false;
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf]
        })
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene( match[0].events )
    }
  }
}

window.OverworldMaps = {
  Kitchen: {
    id: "Kitchen",
    lowerSrc: "/images/maps/KitchenLower2.png",
    upperSrc: "/images/maps/KitchenUpper2.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(10),
        y: utils.withGrid(5),
      },
      kitchenNpcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(5),
        direction: "up",
        src: "/images/characters/people/dad.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "I believe in you!",},
            ]
          }
        ]
      },
      kitchenNpcB: {
        type: "Person",
        x: utils.withGrid(2),
        y: utils.withGrid(5),
        direction: "up",
        src: "/images/characters/people/mom.png",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Dont forget to drink your milk before leaving!", faceHero: "kitchenNpcB" },
            ]
          }
        ],
        behaviorLoop: [
          { type: "walk", direction: "right", },
          { type: "walk", direction: "right", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "left", },
          { type: "walk", direction: "left", },
          { type: "walk", direction: "up", },
          { type: "walk", direction: "up", },
          { type: "stand", direction: "up", time: 500 },
          { type: "stand", direction: "left", time: 500 },
        ]
       },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "Street",
              x: utils.withGrid(11),
              y: utils.withGrid(12),
              direction: "down"
            }
          ]
        }
      ],
      [utils.asGridCoord(10,6)]: [{
        disqualify: ["SEEN_INTRO"],
        events: [
          { type: "addStoryFlag", flag: "SEEN_INTRO"},
          { type: "textMessage", text: "* You wake up the next day after you got your first Ecomon*"},
          { type: "walk", who: "kitchenNpcA", direction: "down"},
          { type: "stand", who: "kitchenNpcA", direction: "right", time: 200},
          { type: "stand", who: "hero", direction: "left", time: 200},
          { type: "textMessage", text: "Son , the boss of the black industry is using his powers for Evil!"},
          { type: "textMessage", text: "He is harnessing non renewable sources of energy and mutating the Ecomons."},
          { type: "textMessage", text: "He is converting them into Eco-ghouls"},
          { type: "textMessage", text: "You have to protect our environment and defeat him with your renewable Ecomons."},
          { type: "stand", who: "kitchenNpcA", direction: "right", time: 200},
          { type: "walk", who: "kitchenNpcA", direction: "up"},
          { type: "stand", who: "kitchenNpcA", direction: "up", time: 300},
          { type: "stand", who: "hero", direction: "down", time: 400},
          { type: "textMessage", text: "*YOUR OBJECTIVE IS TO DEFEAT ECOGOULS WITH YOUR SUSTAINABLE ALTERNATIVES*"},
          // {
          //   type: "changeMap",
          //   map: "Street",
          //   x: utils.withGrid(11),
          //   y: utils.withGrid(12),
          //   direction: "down"
          // },
        ]
      }]
    },
    walls: {
      [utils.asGridCoord(2,4)]: true,
      [utils.asGridCoord(3,4)]: true,
      [utils.asGridCoord(5,4)]: true,
      [utils.asGridCoord(6,4)]: true,
      [utils.asGridCoord(7,4)]: true,
      [utils.asGridCoord(8,4)]: true,
      [utils.asGridCoord(11,4)]: true,
      [utils.asGridCoord(11,5)]: true,
      [utils.asGridCoord(12,5)]: true,
      [utils.asGridCoord(1,5)]: true,
      [utils.asGridCoord(1,6)]: true,
      [utils.asGridCoord(1,7)]: true,
      [utils.asGridCoord(1,9)]: true,
      [utils.asGridCoord(2,9)]: true,
      [utils.asGridCoord(6,7)]: true,
      [utils.asGridCoord(7,7)]: true,
      [utils.asGridCoord(9,7)]: true,
      [utils.asGridCoord(10,7)]: true,
      [utils.asGridCoord(9,9)]: true,
      [utils.asGridCoord(10,9)]: true,
      [utils.asGridCoord(3,10)]: true,
      [utils.asGridCoord(4,10)]: true,
      [utils.asGridCoord(6,10)]: true,
      [utils.asGridCoord(7,10)]: true,
      [utils.asGridCoord(8,10)]: true,
      [utils.asGridCoord(11,10)]: true,
      [utils.asGridCoord(12,10)]: true,

      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(5,11)]: true,

      [utils.asGridCoord(4,3)]: true,
      [utils.asGridCoord(9,4)]: true,
      [utils.asGridCoord(10,4)]: true,

      [utils.asGridCoord(13,6)]: true,
      [utils.asGridCoord(13,7)]: true,
      [utils.asGridCoord(13,8)]: true,
      [utils.asGridCoord(13,9)]: true,

    }
  },
  Street: {
    id: "Street",
    lowerSrc: "/images/maps/StreetLower2.png",
    upperSrc: "/images/maps/StreetUpper2.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(30),
        y: utils.withGrid(10),
      },
      streetNpcA: {
        type: "Person",
        x: utils.withGrid(24),
        y: utils.withGrid(2),
        src: "/images/characters/people/npc2.png",
        behaviorLoop: [
          { type: "stand", direction: "down"}
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Please save our village from the ghoul master on the docks!", faceHero: "streetNpcA" },
            ]
          }
        ]
      },
      streetNpcB: {
        type: "Person",
        x: utils.withGrid(25),
        y: utils.withGrid(9),
        src: "/images/characters/people/npcr1.png",
        behaviorLoop: [
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "down"},
          { type: "walk", direction: "down"},
          { type: "walk", direction: "down"},
          { type: "walk", direction: "down"},
          

        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "THe ghoul master killed my water Ecomon, now how will i get energy!", faceHero: "streetNpcB" },
            ]
          }
        ]
      },
      streetNpcC: {
        type: "Person",
        x: utils.withGrid(38),
        y: utils.withGrid(2),
        src: "/images/characters/people/streetThug.png",
        talking: [
          {
            required: ["streetBattle"],
            events: [
              { type: "textMessage", text: "My brother will defeat you!", faceHero: "streetNpcC" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I am Harley the ghoul master!", faceHero: "streetNpcC" },
              { type: "battle", enemyId: "streetBattle" },
              { type: "addStoryFlag", flag: "streetBattle"},
            ]
          },
        ]
      },
      streetNpcD: {
        type: "Person",
        x: utils.withGrid(21),
        y: utils.withGrid(3),
        src: "/images/characters/people/npc2.png",
        behaviorLoop: [
          { type: "stand", direction: "down"}
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Market is closed because of the ghouls", faceHero: "streetNpcA" },
            ]
          }
        ]
      },
    },
    walls: function() {
      let walls = {};
      ["0,8", "1,8", "2,8", "3,8", "4,7", "4,6", "4,5", "4,4", "4,3", "6,3", "7,3",
       "8,3", "9,3", "10,3", "11,3", "12,3", "13,3", "14,3", "15,3", "16,3", "17,3", "18,2", "18,1", "18,0", "18,3",
        "22,0","22,1","22,2","22,3","21,0","20,0","219,0","23,3","24,3","25,3","26,3","27,3","28,3","29,3","30,3",
        "31,3","32,0","32,1","32,02","32,03","32,04","32,05","32,06","32,07","32,08","32,09","32,10",
        "35,09","36,09","37,09","36,08","38,07","39,07","39,06","33,0","34,0","35,0","36,0","37,0","38,0","39,0",
        "32,19","32,18","32,17","32,16","32,15","32,14","33,14","34,14","35,14","36,14","37,14","38,14","39,14",
        "29,19","30,19","31,19","27,18","27,17","27,16","27,15","27,14","4,14","5,14","6,14","7,14","8,14","9,14",
        "10,14","11,14","12,14","13,14","14,14","15,14","16,14","17,14","18,14","19,14","20,14","21,14","22,14","23,14",
        "24,14","25,14","26,14","4,14","4,13","4,12","4,11","3,11","2,11","1,11","0,11","27,15","27,7","26,15",
        "27,8","27,6","26,8","28,8","15,11","15,7","15,8","15,9","15,10",
        "14,11","14,7","14,8","14,9","14,10","13,11","13,7","13,8","13,9","13,10",
        "12,11","12,7","12,8","12,9","12,10","14,11","11,7","11,8","11,9","11,10",
        "10,11","10,7","10,8","10,9","9,10","9,11","9,7","9,8","9,9","9,10","8,10","8,11","8,7","8,8","8,9","8,10",
        "10,6", "11,6", "12,6", "13,6","27,19","26,7","28,7","19,0","0,9",
      ].forEach(coord => {
        let [x,y] = coord.split(",");
        walls[utils.asGridCoord(x,y)] = true;
      })
      return walls;
    }(),
    cutsceneSpaces: {
      [utils.asGridCoord(11,11)]: [
        {
          events: [
            { 
              type: "changeMap",
              map: "Kitchen",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(28,19)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "DiningRoom",
              x: utils.withGrid(20),
              y: utils.withGrid(3),
              direction: "down"
            }
          ]
        }
      ],
    }
  },
  
  DiningRoom: {
    id: "DiningRoom",
    lowerSrc: "/images/maps/SlumLower.png",
    upperSrc: "/images/maps/SlumUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(20),
        y: utils.withGrid(3),
      },
      diningRoomNpcA: {
        type: "Person",
        x: utils.withGrid(20),
        y: utils.withGrid(15),
        src: "/images/characters/people/vSlum.png",
        talking: [
          {
            required: ["diningRoomBattle"],
            events: [
              { type: "textMessage", text: "Maybe I am not ready for this place.", faceHero: "diningRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I will kill you with my poison!", faceHero: "diningRoomNpcA" },
              { type: "battle", enemyId: "diningRoomBattle", arena: "dining-room" },
              { type: "addStoryFlag", flag: "diningRoomBattle"},
            ]
          },
        ]
      },
      
      diningRoomNpcC: {
        type: "Person",
        x: utils.withGrid(14),
        y: utils.withGrid(9),
        src: "/images/characters/people/npcs1.png",
        behaviorLoop: [
          { type: "walk", direction: "down"},
          { type: "walk", direction: "down"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "right"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "up"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},
          { type: "walk", direction: "left"},],
        talking: [
          {
            events: [
              { type: "textMessage", text: "THAT GUY THERE HAS SUCH STRONG GHOULS!!!!", faceHero: "diningRoomNpcC" },
              { type: "textMessage", text: "I have never seen such STRENGTH!", faceHero: "diningRoomNpcC" },
            ]
          },
        ]
      },
    
    weaponStone: {
            type: "WeaponStone",
            x: utils.withGrid(23),
            y: utils.withGrid(9),
            storyFlag: "STONE_STREET_NORTH",
            weapons: ["s002", "s003"],
          },
     },
    cutsceneSpaces: {
      [utils.asGridCoord(27,11)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Rail",
              x: utils.withGrid(8),
              y: utils.withGrid(9),
              direction: "right"
            }
          ]
        }
      ],
      [utils.asGridCoord(20,3)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(28),
              y: utils.withGrid(19),
              direction: "up"
            }
          ]
        }
      ],
    },
    
    walls: function() {
      let walls = {};
      ["19,4","19,5","19,7","19,6","19,8","18,8","17,8","16,8","15,8","14,8","13,8","12,8",
      "12,9","12,10","12,11","12,12","12,13","12,14","12,15","12,16","12,17","12,18","12,19",
      "13,16","14,16","15,16","15,17","15,18","15,19","24,7","24,8","25,7","25,8","26,7","26,8",
      "24,5","24,4","25,5","24,6","25,6","24,7","25,7","26,9","26,10","14,12","15,12","16,12","17,12","18,12","19,12","20,12","21,12",
      "17,17","18,17","19,17","20,17","17,18","18,18","19,18","20,18",
      "17,19","19,19","19,19","20,19","16,19","21,19","22,19","22,18","22,17","22,16","22,15","22,14",
      "23,14","24,14","25,14","26,14","27,14","27,13","27,12","23,4","22,4","21,4","19,3","20,2","21,3"
      
    ].forEach(coord => {
      let [x,y] = coord.split(",");
      walls[utils.asGridCoord(x,y)] = true;
    })
    return walls;
  }(),
  },
  Rail: {
    id: "Rail",
    lowerSrc: "/images/maps/RailLower.png",
    upperSrc: "/images/maps/RailUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(20),
        y: utils.withGrid(3),
      },
      railRoomNpcA: {
        type: "Person",
        x: utils.withGrid(22),
        y: utils.withGrid(9),
        src: "/images/characters/people/Harry.png",
        talking: [
          {
            required: ["railRoomBattle"],
            events: [
              { type: "textMessage", text: "Me and my brother will always use Ecomons. ", faceHero: "railRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "You have defeated my brother!", faceHero: "railRoomNpcA" }, 
              { type: "textMessage", text: "I WILL AVENGE HIM!", faceHero: "railRoomNpcA" },
              { type: "battle", enemyId: "railRoomBattle", arena: "rail-room" },
              { type: "addStoryFlag", flag: "railRoomBattle"},
            ]
          },
        ]
      },
      
      railRoomNpcC: {
        type: "Person",
        x: utils.withGrid(11),
        y: utils.withGrid(16),
        src: "/images/characters/people/npcr2.png",
        behaviorLoop: [
          { type: "stand", direction: "right", time: 800, },
          { type: "stand", direction: "down", time: 700, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "AAAAAGGGHHHH!!!!!!", faceHero: "railRoomNpcC" },
            ]
          },
        ]
      },
      railRoomNpcD: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(8),
        src: "/images/characters/people/npcr1.png",
        behaviorLoop: [
          { type: "stand", direction: "right", time: 1200, },
          { type: "stand", direction: "down", time: 900, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "right", time: 400, },
          { type: "stand", direction: "up", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "That ghoul master is so scary!", faceHero: "railRoomNpcD" },
            ]
          },
        ]
      },
      weaponStone: {
        type: "WeaponStone",
        x: utils.withGrid(11),
        y: utils.withGrid(8),
        storyFlag: "STONE_RAIL",
        weapons: ["v001", "s003"],
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(19,9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "night",
              x: utils.withGrid(8),
              y: utils.withGrid(10),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(8,9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "DiningRoom",
              x: utils.withGrid(19),
              y: utils.withGrid(9),
              direction: "up"
            }
          ]
        }
      ],
      
    },
    walls: function() {
      let walls = {};
      ["7,10","7,9","7,8","7,7","7,6","8,6","9,6","10,6","11,6","12,7","12,8",
      "13,8","14,8","15,8","16,8","17,8","18,7","19,7","21,7","22,7","23,7","23,8",
      "24,8","25,8","26,8","27,8","28,8","28,7","29,6",
      "8,11","9,11","10,11","11,11","12,11","13,11","14,11","15,11","16,11","17,11","18,11","19,11","20,11","21,11","22,11",
      "23,11","24,11","25,11","26,11","27,11","28,11","29,11","13,9","14,9","15,9"

    ].forEach(coord => {
      let [x,y] = coord.split(",");
      walls[utils.asGridCoord(x,y)] = true;
    })
    return walls;
  }(),
  },
  
  night: {
    id: "night",
    lowerSrc: "/images/maps/nightCityLower.png",
    upperSrc: "/images/maps/nightCityUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(20),
        y: utils.withGrid(3),
      },
      nightRoomNpcA: {
        type: "Person",
        x: utils.withGrid(25),
        y: utils.withGrid(8),
        src: "/images/characters/people/barry.png",
        talking: [
          {
            required: ["nightRoomBattle"],
            events: [
              { type: "textMessage", text: "Maybe I am not ready for this place.", faceHero: "nightRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I will never let you get to the boss!", faceHero: "nightRoomNpcA" },
              { type: "battle", enemyId: "nightRoomBattle", arena: "rail-room" },
              { type: "addStoryFlag", flag: "nightRoomBattle"},
            ]
          },
        ]
      },
      nightRoomNpcC: {
        type: "Person",
        x: utils.withGrid(36),
        y: utils.withGrid(15),
        src: "/images/characters/people/npcn2.png",
        behaviorLoop: [
          { type: "stand", direction: "right", time: 800, },
          { type: "stand", direction: "down", time: 700, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Please defeat the boss and save us!", faceHero: "nightRoomNpcC" },
            ]
          },
        ]
      },
      nightRoomNpcD: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(9),
        src: "/images/characters/people/npcn1.png",
        behaviorLoop: [
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "right" },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "left" },
          { type: "walk", direction: "left" },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "My ecomon is badly injured!", faceHero: "nightRoomNpcD" },
              { type: "textMessage", text: "HELP!!!", faceHero: "nightRoomNpcD" },
            ]
          },
        ]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(30,11)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "boss",
              x: utils.withGrid(4),
              y: utils.withGrid(12),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(8,10)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Rail",
              x: utils.withGrid(19),
              y: utils.withGrid(9),
              direction: "up"
            }
          ]
        }
      ],
      
    },
    walls: function() {
      let walls = {};
      ["8,9","8,8","8,7","9,7","10,6","11,6","12,6","13,6","14,6","15,6",
      "16,6","17,6","18,6","19,6","20,6","21,6","22,6","23,6","24,6","25,6",
      "26,7","26,8","27,8","28,9","28,10","28,11","29,11","37,11","31,11","32,11",
      "33,11","34,11","35,11","36,11","38,12","38,13","38,14","37,14","36,14",
      "35,14","34,14","33,14","32,14","31,14","30,14","29,14","28,14","27,14","26,14",
      "25,14","24,14","24,13","24,12","24,11","24,10",
      "23,10","22,10","21,10","20,10","19,10","18,10","17,10","16,10","15,10","14,10",
      "13,10","12,10","11,10","10,11","9,12","8,11"

    ].forEach(coord => {
      let [x,y] = coord.split(",");
      walls[utils.asGridCoord(x,y)] = true;
    })
    return walls;
  }(),
  },

  boss: {
    id: "boss",
    lowerSrc: "/images/maps/ThroneRoom.png",
    upperSrc: "/images/maps/ThroneRoomUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(20),
        y: utils.withGrid(3),
      },
      bossRoomNpcA: {
        type: "Person",
        x: utils.withGrid(5),
        y: utils.withGrid(5),
        src: "/images/characters/people/boss.png",
        talking: [
          {
            required: ["bossRoomBattle"],
            events: [
              { type: "textMessage", text: "You have defeated me and have made me realise the inportance of", faceHero: "bossRoomNpcA" },
              { type: "textMessage", text: "renewable energy and how Ecomons are important for survival!", faceHero: "bossRoomNpcA" },
              { type: "textMessage", text: "We will be getting rid of Ghouls and will promote Ecomons.", faceHero: "bossRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I am the one who made these ghouls with pollutants ,", faceHero: "bossRoomNpcA" },
              { type: "textMessage", text: "and the profits are soaring  ,", faceHero: "bossRoomNpcA" },
              { type: "textMessage", text: "you are just a kid ,", faceHero: "bossRoomNpcA" },
              { type: "textMessage", text: "YOU CAN'T DEFEAT ME!  ,", faceHero: "bossRoomNpcA" },
              { type: "battle", enemyId: "bossRoomBattle",  arena: "green-kitchen"  },
              { type: "addStoryFlag", flag: "bossRoomBattle"},
            ]
          },
        ]
      },
      
      bossRoomNpcC: {
        type: "Person",
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        src: "/images/characters/people/guard.png",
        behaviorLoop: [
          
          { type: "stand", direction: "down", time: 700, },
          
        ],
        
        talking: [
          {
            required: ["bossRoomBattle"],
            events: [
              { type: "textMessage", text: "We love Ecomons!", faceHero: "bossRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "The boss will destroy you.", faceHero: "bossRoomNpcC" },
            ]
          },
        ]
      },
      bossRoomNpcD: {
        type: "Person",
        x: utils.withGrid(2),
        y: utils.withGrid(5),
        src: "/images/characters/people/guard.png",
        behaviorLoop: [
          { type: "stand", direction: "down", time: 700, },
        ],
        talking: [
          {
            required: ["bossRoomBattle"],
            events: [
              { type: "textMessage", text: "We love Ecomons!", faceHero: "bossRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "The boss will destroy you.!", faceHero: "bossRoomNpcD" },
            ]
          },
        ]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(4,12)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "night",
              x: utils.withGrid(30),
              y: utils.withGrid(12),
              direction: "up"
            }
          ]
        }
      ],
      
      
    },
    walls: function() {
      let walls = {};
      ["0,11","0,10","0,9","0,8","0,7","0,6","0,5","0,4","1,3","2,3","3,4","3,5",
      "4,3","5,4","6,3","7,4","7,5","8,3","9,3","10,3",
      "10,4","10,5","10,6","10,7","10,8","10,9","10,10","10,11","10,12",
      "1,12","2,12","3,12","5,12","6,12","7,12","8,12","9,12",



    ].forEach(coord => {
      let [x,y] = coord.split(",");
      walls[utils.asGridCoord(x,y)] = true;
    })
    return walls;
  }(),
  },
}

