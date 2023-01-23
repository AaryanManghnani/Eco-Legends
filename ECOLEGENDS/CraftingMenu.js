class CraftingMenu {
  constructor({ weapons, onComplete}) {
    this.weapons = weapons;
    this.onComplete = onComplete;
  }

  getOptions() {
    return this.weapons.map(id => {
      const base = Weapons[id];
      return {
        label: base.name,
        description: base.description,
        handler: () => {
          playerState.addWeapon(id);
          this.close();
        }
      }
    })
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("CraftingMenu");
    this.element.classList.add("overlayMenu");
    this.element.innerHTML = (`
      <h2>You have won an ecomon from you last battle, choose yours!</h2>
    `)
  }

  close() {
    this.keyboardMenu.end();
    this.element.remove();
    this.onComplete();
  }


  init(container) {
    this.createElement();
    this.keyboardMenu = new KeyboardMenu({
      descriptionContainer: container
    })
    this.keyboardMenu.init(this.element)
    this.keyboardMenu.setOptions(this.getOptions())

    container.appendChild(this.element);
  }
}