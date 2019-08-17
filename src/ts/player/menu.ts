namespace PRKR.Player {

  export class Menu {

    private _$dom: JQuery;
    private _visible = false;

    constructor() {
      this._buildDom();
    }

    get dom() {
      return this._$dom[0];
    }

    get visible() { return this._visible; }

    set visible(value: boolean) {
      if (value != this._visible) {

        this._$dom.toggleClass('hidden', !value);

        this._visible = value;
      }
    }

    show() {
      this.visible = true;
    }

    hide() {
      this.visible = false;
    }

    toggle() {
      this.visible = !this._visible;
    }

    private _onCloseClicked(evt: JQuery.ClickEvent) {
      this.hide();
    }

    private _onInputChange(evt: JQuery.ChangeEvent) {

      let $target = $(evt.target);
      let config = LocalConfiguration.get();

      let name = $target.attr('name');
      let type = $target.attr('type');

      if (type === 'checkbox') {
        config[name] = (<any>$target[0]).checked;
      } else {
        config[name] = $target.val();
      }

      LocalConfiguration.set(config);

    }

    private _buildDom() {

      let cfg = LocalConfiguration.get();

      let checked = 'checked="checked"';

      this._$dom = $(
        `<div id="prpl-menu" class="prpl-menu hidden">
          <div class="menu-content">
            <div class="menu-close"><i class="fa fa-times" /></div>
            <div class="menu-title">Menu</div>
            <div class="menu-section">
              <div class="menu-section-title">Debug options</div>
              <div class="menu-option">
                <input id="displayStandingPoint" name="displayStandingPoint" type="checkbox" ${ cfg.displayStandingPoint ? checked : '' } />
                <label for="displayStandingPoint">Display standing point</label>
              </div>
            </div>
          </div>
        </div>`
      );

      this._$dom.find('input').on('change', evt => this._onInputChange(evt));
      this._$dom.find('.menu-close').on('click', evt => this._onCloseClicked(evt));
    }

  }
}
