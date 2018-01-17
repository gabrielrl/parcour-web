namespace PRKR.Player {

  interface EditorMessage {
    command: string;
    payload: any;
  }

  export class EditorLinkHandler {

    private _editor: Window;

    constructor(private _player: ParcourPlayer) { }

    public init(window: Window) {

      this._editor = window.opener

      $(window).on('message', (event: JQueryInputEventObject) => {
        console.log('on message');
        console.log(event);

        var message: EditorMessage = (<MessageEvent>event.originalEvent).data;
        if (message && message.command) {
          this._handleMessage(message);
        }
      });

    }

    public notifyReady() {
      console.log('Notifying the editor we\'re ready.');
      this._editor.postMessage('ready', '*');
    }

    private _handleMessage(message) {
      if (message.command === 'load' && message.payload) {
        let model = new PRKR.Model.Parcour(message.payload);

        console.log('loading model:', model);

        this._player.load(model);
        this._player.run();
      }
    }
  }
}