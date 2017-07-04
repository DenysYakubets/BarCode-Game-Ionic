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
  public static NICKNAME_ID_KEY: string = "NICKNAME_ID_KEY";

  constructor(public navigation: NavController, public toast: Toast,
    private splashScreen: SplashScreen, private platform: Platform,
    private nativeStorage: NativeStorage, private loadingCtrl: LoadingController) {

    this.platform.ready().then(() => {
      this.nativeStorage.getItem(LoginPage.NICKNAME_ID_KEY)
        .then(nickname => {
          if (!nickname || 0 === nickname.length) return;
          this.navigateToHomePage(nickname);
          this.splashScreen.hide();
        })
        .catch(() => this.splashScreen.hide());
    });
  }

  navigateToHomePage(nickname: string) {
    if (!nickname || 0 === nickname.length) {
      this.toast.showShortBottom("nickname ?").subscribe();
      return;
    }

    let loader = this.loadingCtrl.create();
    loader.present();

    this.nativeStorage.setItem(LoginPage.NICKNAME_ID_KEY, nickname)
      .then(() => {
        this.navigation.push(HomePage, { nickname: nickname });
        loader.dismiss();
      })
      .catch(() => loader.dismiss());
  }
}