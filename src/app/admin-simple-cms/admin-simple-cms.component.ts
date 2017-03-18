import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, NgModel } from '@angular/forms';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase';

@Component({
  selector: 'fm-admin-simple-cms',
  templateUrl: './admin-simple-cms.component.html',
  styleUrls: ['./admin-simple-cms.component.scss']
})
export class AdminSimpleCMSComponent implements OnInit {
  simpleItems: FirebaseObjectObservable<any>;
  editForm: FormGroup;
  editState: string;
  items = {
    title: '',
    subtitle: '',
    img: '',
    content: ''
  };
  constructor(private af: AngularFire, public fb: FormBuilder) {
    this.simpleItems = this.af.database.object('/simplecms');
    this.simpleItems.subscribe(snapshot => {
      this.items.title = snapshot.title;
      this.items.subtitle = snapshot.subtitle;
      this.items.img = snapshot.img;
      this.items.content = snapshot.content;
      this.setValues();
    });
    this.buildForm();
   }

  ngOnInit() {
  }
  buildForm() {
    this.editForm = this.fb.group({
      title: '',
      subtitle: '',
      img: '',
      content: ''
    });
  }
  setValues() {
    this.editForm.setValue({
      title: this.items.title,
      subtitle: this.items.subtitle,
      img: this.items.img,
      content: this.items.content
    });
  }
  updateView(form) {
      this.simpleItems.update({
        title: form.controls.title.value,
        subtitle: form.controls.subtitle.value,
        img: form.controls.img.value,
        content: form.controls.content.value
      }).then(() => {
        this.editState = 'View has been updated';
        setTimeout(() => {
          this.editState =  '';
        }, 2000);
      }).catch(err => {
        console.error(err.message);
    });
  }
}
