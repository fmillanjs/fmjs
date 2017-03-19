import { Component, OnInit, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFire, FirebaseObjectObservable, FirebaseListObservable } from 'angularfire2';
import { Observable } from 'Rxjs';

export class Contact {
  constructor(
    public name: string,
    public email: string,
    public phone: any,
    public message: string
  ) {}
}

@Component({
  selector: 'fm-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  details: string;
  sending = false;
  height: number;
  contact = new Contact('Ex. John Codeman',
                        'Ex. John@gmail.com',
                        'Ex. (619)333-9802',
                        'Ex. I want to hire you. :)');
  formObservable: FirebaseListObservable<any>;
  constructor(private router: Router, private af: AngularFire) {
    this.formObservable = this.af.database.list('/contacts');
   }
  ngOnInit() {
    this.height = this.getHeight();
  }

  send(form) {
    this.sending = true;
    this.details = 'Sending Message...';
    this.formObservable.push(form).catch(err => console.log(err.message));
  setTimeout(() => {
      this.sending = false;
      this.closePopup();
    }, 1000);
  }

  cancel() {
    this.closePopup();
  }

  closePopup() {
    // Providing a `null` value to the named outlet
    // clears the contents of the named outlet
    this.router.navigate([{ outlets: { popup: null }}]);
  }
  getHeight() {
    let body = document.body,
    html = document.documentElement;
    return Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
  }

}
