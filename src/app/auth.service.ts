import { Injectable } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods, FirebaseListObservable } from 'angularfire2';

interface User {
  $uid: number;
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private users: FirebaseListObservable<any[]>;

  constructor(public af: AngularFire) { }
  getUsers() {
    this.users = this.af.database.list('/users') as FirebaseListObservable<User[]>;
    return this.users;
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
  loginGithub() {
    return this.af.auth.login({
      provider: AuthProviders.Github,
      method: AuthMethods.Popup
    });
  }
  logout() {
    return this.af.auth.logout();
  }

}
