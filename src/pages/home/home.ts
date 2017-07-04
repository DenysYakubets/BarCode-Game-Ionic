import { LoginPage } from './../login/login';
import { BarCode } from './bar-code';
import { Component, ViewChild } from '@angular/core';
import { Content, AlertController, NavParams, Platform, LoadingController, NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { NativeStorage } from '@ionic-native/native-storage';
import { Toast } from '@ionic-native/toast';
import { Http, Headers, RequestOptions } from '@angular/http';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(Content) content: Content;
  public barCodeList: BarCode[] = [];
  public nickname: string;
  public gameID: string;
  public loader: any;
  public sendBtnColor: string = "royal";

  constructor(
    private alertCtrl: AlertController, private barcodeScanner: BarcodeScanner,
    private nativeStorage: NativeStorage, private toast: Toast,
    private navParams: NavParams, private platform: Platform,
    private http: Http, public loadingCtrl: LoadingController,
    public navigation: NavController) {
    this.platform.ready().then(() => {

      //Back button event
      this.platform.registerBackButtonAction(() => {
        this.loader!.dismiss();
        this.clearResultAndLogOut();
      });

      //if app goes sleep - save all data
      this.platform.pause.subscribe(() => {
        this.saveResult();
        this.saveGameAndNickName();
      });
    });
  }

  ionViewDidLoad() {
    this.nickname = this.navParams.get('nickname');
    this.gameID = this.navParams.get('gameID');

    this.restoreLastList();
  }

  scrollToBottom() {
    this.content.scrollToBottom();
  }

  scanCode() {
    this.barcodeScanner.scan().then((barcodeData) => {
      if (!barcodeData.text || 0 === barcodeData.text.trim().length) return;
      this.barCodeList.push(new BarCode(barcodeData.text, this.getDateTime(Date.now())));
      this.scrollToBottom();
    }, (err) => {
      this.toast.show(err, '5000', 'bottom').subscribe();
    });

    // Debug mode
    // this.barCodeList.push(new BarCode("barcodeData.text", this.getDateTime(Date.now())));
    // this.scrollToBottom();
  }

  saveResult() {
    if (this.barCodeList.length <= 0) return;

    this.nativeStorage.setItem(Date.now() + "", this.barCodeList)
      .then(
      () => this.toast.showShortBottom('Saved').subscribe(),
      error => this.toast.show(error, '5000', 'bottom').subscribe()
      );
  }

  restoreResult() {
    this.nativeStorage.keys().then(
      data => this.showListSavedKeys(data),
      error => this.toast.show(error, '5000', 'bottom').subscribe()
    );
  }

  restoreLastList() {
    this.nativeStorage.keys().then(
      keys => {
        if (keys.length <= 2) return;

        let sortedKeys = keys.sort();
        sortedKeys = sortedKeys.reverse();

        // 0 - GAME 1 - NICK - 2 - LAST DATA
        // TODO: change logic of getting last data
        this.nativeStorage.getItem(sortedKeys[2]).then(
          data => { this.barCodeList = data; this.scrollToBottom(); },
          error => error => this.toast.show(error, '5000', 'bottom').subscribe()
        );
      },
      error => this.toast.show(error, '5000', 'bottom').subscribe()
    );
  }

  saveGameAndNickName() {
    Promise.all([
      this.nativeStorage.setItem(LoginPage.NICKNAME_ID_KEY, this.nickname),
      this.nativeStorage.setItem(LoginPage.GAME_ID_KEY, this.gameID)
    ]).then();
  }

  clearResultAndLogOut() {
    let alert = this.alertCtrl.create({
      title: 'Delete all and exit?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => {
            this.nativeStorage.clear().then(() => {
              if (this.navigation.canGoBack()) {
                this.platform.pause.unsubscribe();
                this.navigation.pop();
              }
            });
          }
        }
      ]
    });
    alert.present();
  }

  sendResult() {
    if (this.barCodeList.length <= 0) return;

    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    this.loader = this.loadingCtrl.create();
    this.loader.present();

    this.http.post("https://barcode-game.denysyakubets.tk/saveResult.php?game="
      + this.gameID + "&nick=" + this.nickname, this.barCodeList, options)
      .subscribe(
      data => {
        this.loader.dismiss();
        console.log(data);
        if (data.status == 200) {
          this.toast.showShortBottom('Complete!').subscribe();
          this.sendBtnColor = "light-green";
        }
        else {
          this.toast.showLongBottom('Error! Something went wrong. Please, try again later.').subscribe();
          this.sendBtnColor = "light-danger";
        }
      },
      error => {
        this.toast.showShortBottom('Something went wrong. Maybe you set wrong game name.').subscribe();
        this.sendBtnColor = "light-danger";
        this.loader.dismiss();
      }
      );
  }

  private getDateTime(timestamp: number): string {
    let currentdate = new Date(timestamp);
    var datetime = ((currentdate.getDate() < 10) ? "0" : "") + currentdate.getDate() + "/"
      + ((currentdate.getMonth() + 1 < 10) ? "0" : "") + (currentdate.getMonth() + 1) + "/"
      + currentdate.getFullYear() + " @ "
      + ((currentdate.getHours() < 10) ? "0" : "") + currentdate.getHours() + ":"
      + ((currentdate.getMinutes() < 10) ? "0" : "") + currentdate.getMinutes() + ":"
      + ((currentdate.getSeconds() < 10) ? "0" : "") + currentdate.getSeconds();
    return datetime;
  }

  private showListSavedKeys(keys: any) {
    if (keys.length <= 2) return;

    let sortedKeys = keys.sort();
    sortedKeys = sortedKeys.reverse();

    let alert = this.alertCtrl.create();
    sortedKeys.forEach(element => {
      if (element == LoginPage.GAME_ID_KEY || element == LoginPage.NICKNAME_ID_KEY) return;

      alert.addInput({
        type: 'radio',
        label: this.getDateTime(+element),
        value: element
      });
    });
    alert.addButton('Cancel');
    alert.addButton({
      text: 'OK',
      handler: data => {
        this.nativeStorage.getItem(data)
          .then(
          data => this.barCodeList = data,
          error => error => this.toast.show(error, '5000', 'bottom').subscribe()
          );
      }
    });
    alert.present();
  }

}
