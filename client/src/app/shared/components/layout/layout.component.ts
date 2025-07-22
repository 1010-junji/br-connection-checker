import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, Data } from '@angular/router';
import { filter, map, mergeMap, takeUntil, startWith } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { LayoutService, PageHeader } from '../../services/layout.service';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';

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
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('scrollableContent') private scrollableContent!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  isSidenavOpen$: Observable<boolean>;
  pageHeaderState$: Observable<PageHeader>;

  navItems: NavItem[] = [
    { link: '/home', name: 'ホーム', icon: 'home' },
    { link: '/connection-checker', name: '疎通チェッカー', icon: 'power' },
    { link: '/backup-editor', name: 'バックアップ編集', icon: 'dynamic_form' },
    { link: '/license-activator', name: 'ライセンス認証', icon: 'vpn_key' },
  ];

  constructor(
    private layoutService: LayoutService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.isSidenavOpen$ = this.layoutService.isSidenavOpen$;
    this.pageHeaderState$ = this.layoutService.pageHeaderState$;
  }

  ngOnInit(): void {
    this.setupPageHeaderUpdater();
    this.setupScrollRequestHandler();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private setupPageHeaderUpdater(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(this.router), // 初期表示時にも発火させる
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data),
      takeUntil(this.destroy$)
    ).subscribe((data: Data) => {
      const showBackButton = data['showBackButton'] ?? false;
      const title = data['title'] || 'コネクションチェッカー';
      this.layoutService.setPageHeader({ title, showBackButton });
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
    this.layoutService.setSidenavOpen(false);
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
      }, 100);
    } catch (err) {
      console.error('Scroll failed:', err);
    }
  }
}