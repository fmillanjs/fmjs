import { Injectable } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';

interface User {
  $uid: number;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {

  constructor(public af: AngularFire) { }
  getCmsItems() {
    return this.af.database.object('/simplecms');
  }
  registerUser(registerForm) {
    return this.af.auth.createUser({
      email: registerForm.controls.email.value,
      password: registerForm.controls.password.value
    });
  }
  loginEmail(loginForm) {
    return this.af.auth.login({
      email: loginForm.controls.email.value,
      password: loginForm.controls.password.value,
    },
    {
      provider: AuthProviders.Password,
      method: AuthMethods.Password,
  });
  }
  loginGoogle() {
    return this.af.auth.login({
      provider: AuthProviders.Google,
      method: AuthMethods.Popup
    });
  }
  logout() {
    return this.af.auth.logout();
  }

}
