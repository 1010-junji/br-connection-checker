import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // ViewChild, ElementRef をインポート
import { HeaderService } from './shared/header.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('scrollableContent') private scrollableContent!: ElementRef<HTMLElement>;

  title$!: Observable<string>;
  showBackButton$!: Observable<boolean>;

  constructor(private headerService: HeaderService) {}

  ngOnInit() {
    this.title$ = this.headerService.title$;
    this.showBackButton$ = this.headerService.showBackButton$;

    // HeaderServiceにスクロール機能を登録する
    this.headerService.setScrollRequestHandler(() => {
      this.scrollToBottom();
    });
  }
  
  scrollToBottom(): void {
    try {
      const element = this.scrollableContent.nativeElement;
      setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    } catch (err) {
      console.error('Scroll failed:', err);
    }
  }
}