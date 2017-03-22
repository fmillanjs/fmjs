import { Component, OnInit, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import { AuthService } from './auth.service';

@Component({
  selector: 'fm-simple-cms',
  templateUrl: './simple-cms.component.html',
  styleUrls: ['./simple-cms.component.scss']
})
export class SimpleCMSComponent implements OnInit {
  private logged: Boolean = false;
  private registered: Boolean = false;
  private show = false;
  private loginForm: FormGroup;
  private registerForm: FormGroup;
  public onLoginError = '';
  public onRegisterError = '';
  // tslint:disable-next-line:max-line-length
  private emailPatt = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  private simplecms: FirebaseObjectObservable <any>;
  title: string;
  imgUrl: string;
  content: string;
  subtitle: string;
  subs: any;
  constructor(private fb: FormBuilder, private af: AngularFire, public as: AuthService) {
    this.as.af.auth.subscribe(
      (auth) => {
        (auth == null) ? this.logged = false : this.logged = true;
      }
    );
    this.buildForm();
    this.simplecms = this.as.getCmsItems();
    this.simplecms.subscribe(snapshot => {
      this.title = snapshot.title;
      this.subtitle = snapshot.subtitle;
      this.imgUrl = snapshot.img;
      this.content = snapshot.content;
    });
  }

  ngOnInit() {
  }

  buildForm() {
    this.loginForm = this.fb.group({
      email: this.fb.control(null, [Validators.required,
                                    Validators.pattern(this.emailPatt)]),
      password: this.fb.control(null, [Validators.required,
                                      Validators.minLength(6)])
    });
    this.registerForm = this.fb.group({
      email: this.fb.control(null, [Validators.required,
                                    Validators.pattern(this.emailPatt)]),
      password: this.fb.control(null, [Validators.required,
                                      Validators.minLength(6)])
    });
    this.loginForm.valueChanges.subscribe(data => this.onValueChanged(data));
    this.registerForm.valueChanges.subscribe(data => this.onValueChanged(data));
  }
  onSubmitLogin(loginForm) {
    this.as.loginEmail(loginForm)
            .then(a => {
                this.logged = true;
                this.loginForm.reset();
              })
            .catch(error => {
              this.onLoginError = error.message;
              setTimeout(() => {
                this.onLoginError = '';
              }, 2000);
            });
  }
  onSubmitRegister(registerForm) {
    this.as.registerUser(registerForm)
            .then(a => {
                this.registered = true;
                this.registerForm.reset();
              })
            .catch(err => {
              this.onRegisterError = err.message;
              setTimeout(() => {
                this.onRegisterError = '';
              }, 2000);
            });
  }
  onSubmitGoogle() {
    this.as.loginGoogle().then(onResolve => {
      this.logged = true;
    });
  }
  showLogin() {
    this.show = true;
  }
  showRegister() {
    this.show = false;
  }
  onLogOut() {
    this.as.logout();
  }
  onValueChanged(data) {
    let form: FormGroup;
    if (!this.loginForm) { return; } else if (this.show === true) { form = this.loginForm; }
    if (!this.registerForm) { return; } else if (this.show === false) { form = this.registerForm; }

    // tslint:disable-next-line:forin
    for (const field in this.formErrors) {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        // tslint:disable-next-line:forin
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
      if (control.value === '') {
        this.formErrors[field] = '';
      }
    }
  }

  // tslint:disable-next-line:member-ordering
  formErrors = {
    'email': '',
    'password': ''
  };
  validationMessages = {
    'email': {
      'required':      'Email is required.',
      'pattern':     'Email not Valid.',
    },
    'password': {
      'required': 'Password is required.',
      'minlength': 'Password must be at least 6 characters long.'
    }
  };

}
