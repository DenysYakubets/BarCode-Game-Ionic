import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { NavController, Platform, LoadingController } from 'ionic-angular';
import { Toast } from '@ionic-native/toast';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NativeStorage } from '@ionic-native/native-storage';


@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  public static GAME_ID_KEY: string = "GAME_ID_KEY";
  public static NICKNAME_ID_KEY: string = "NICKNAME_ID_KEY";

  constructor(public navigation: NavController, public toast: Toast,
    private splashScreen: SplashScreen, private platform: Platform,
    private nativeStorage: NativeStorage, private loadingCtrl: LoadingController) {

    this.platform.ready().then(() => {

      Promise.all([
        this.nativeStorage.getItem(LoginPage.NICKNAME_ID_KEY),
        this.nativeStorage.getItem(LoginPage.GAME_ID_KEY)
      ])
        .then(data => {
          if (!data[0] || 0 === data[0].length || !data[1] || 0 === data[1].length) return;
          this.navigateToHomePage(data[0], data[1]);
          this.splashScreen.hide();
        })
        .catch(() => this.splashScreen.hide());
    });
  }

  navigateToHomePage(nickname: string, gameID: string) {
    if (!nickname || 0 === nickname.length) {
      this.toast.showShortBottom("nickname ?").subscribe();
      return;
    }
    if (!gameID || 0 === gameID.length) {
      this.toast.showShortBottom("game # ?").subscribe();
      return;
    }

    let loader = this.loadingCtrl.create();
    loader.present();

    Promise.all([
      this.nativeStorage.setItem(LoginPage.NICKNAME_ID_KEY, nickname),
      this.nativeStorage.setItem(LoginPage.GAME_ID_KEY, gameID)
    ])
      .then(() => {
        this.navigation.push(HomePage, { nickname: nickname, gameID: gameID });
        loader.dismiss();
      })
      .catch(() => loader.dismiss());
  }
}