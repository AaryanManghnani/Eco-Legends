class PlayerState {
  constructor() {
    this.weapons = {
      "w1": {
        weaponId: "s001",
        hp: 50,
        maxHp: 50,
        xp: 0,
        maxXp: 100,
        level: 1,
        status: null,
      },
      // "p2": {
      //   weaponId: "v001",
      //   hp: 50,
      //   maxHp: 50,
      //   xp: 75,
      //   maxXp: 100,
      //   level: 1,
      //   status: null,
      // },
      // "p3": {
      //   weaponId: "f001",
      //   hp: 50,
      //   maxHp: 50,
      //   xp: 75,
      //   maxXp: 100,
      //   level: 1,
      //   status: null,
      // }
    }
    this.lineup = ["w1"];
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ]
    this.storyFlags = {
    };
  }

  addWeapon(weaponId) {
    const newId = `p${Date.now()}`+Math.floor(Math.random() * 99999);
    this.weapons[newId] = {
      weaponId,
      hp: 50,
      maxHp: 50,
      xp: 0,
      maxXp: 100,
      level: 1,
      status: null,
    }
    if (this.lineup.length < 3) {
      this.lineup.push(newId)
    }
    utils.emitEvent("LineupChanged");
  }

  swapLineup(oldId, incomingId) {
    const oldIndex = this.lineup.indexOf(oldId);
    this.lineup[oldIndex] = incomingId;
    utils.emitEvent("LineupChanged");
  }

  moveToFront(futureFrontId) {
    this.lineup = this.lineup.filter(id => id !== futureFrontId);
    this.lineup.unshift(futureFrontId);
    utils.emitEvent("LineupChanged");
  }

}
window.playerState = new PlayerState();