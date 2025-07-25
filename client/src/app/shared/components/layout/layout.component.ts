import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Data } from '@angular/router';
import { filter, map, mergeMap, takeUntil, startWith } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LayoutService, PageHeader } from '../../services/layout.service';
import { MatSidenav } from '@angular/material/sidenav';

const DEFAULT_TITLE = 'BR! 統合メンテナンスツール';
const SCROLL_TO_BOTTOM_DELAY_MS = 100;

interface NavItem {
  link: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('scrollableContent') private scrollableContent!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  isSidenavOpen: boolean = false;
  pageHeader: PageHeader = { title: DEFAULT_TITLE };

  navItems: NavItem[] = [
    { link: '/home', name: 'ホーム', icon: 'home' },
    { link: '/connection-checker', name: 'コンポーネント間疎通チェッカー', icon: 'power' },
    { link: '/backup-editor', name: 'バックアップファイル編集ツール', icon: 'dynamic_form' },
    { link: '/license-activator', name: 'ライセンス認証ブラウザー', icon: 'vpn_key' },
  ];

  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.layoutService.isSidenavOpen$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isOpen => {
      this.isSidenavOpen = isOpen;
      // AfterViewInitが呼ばれた後であれば、Sidenavを直接操作
      if (this.sidenav) {
        this.isSidenavOpen ? this.sidenav.open() : this.sidenav.close();
      }
    });

    this.layoutService.pageHeaderState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(headerState => {
      this.pageHeader = headerState;
    });
    
    this.setupPageHeaderUpdater();
    this.setupScrollRequestHandler();
  }

  // AfterViewInitは不要になるか、あるいは最初の状態同期のために残す
  ngAfterViewInit(): void {
    // コンポーネント初期化時に、サービスが持つ最新の状態でSidenavを同期する
    if (this.isSidenavOpen) {
      this.sidenav.open();
    } else {
      this.sidenav.close();
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupPageHeaderUpdater(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(this.router),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data),
      takeUntil(this.destroy$)
    ).subscribe((data: Data) => {
      const title = data['title'] || DEFAULT_TITLE;
      this.layoutService.setPageHeader({ title });
    });
  }

  private setupScrollRequestHandler(): void {
    this.layoutService.scrollToBottomRequest$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.scrollToBottom();
    });
  }

  toggleSidenav(): void {
    this.layoutService.toggleSidenav();
  }

  onSidenavClosed(): void {
    // ユーザーがEscapeキーや背景クリックで閉じた場合の状態同期
    if (this.isSidenavOpen) {
      this.layoutService.setSidenavOpen(false);
    }
  }
  
  isLinkActive(link: string): boolean {
    return this.router.isActive(link, false);
  }
  
  private scrollToBottom(): void {
    if (!this.scrollableContent) return;
    try {
      const element = this.scrollableContent.nativeElement;
      setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }, SCROLL_TO_BOTTOM_DELAY_MS);
    } catch (err) {
      console.error('Scroll failed:', err);
    }
  }
}