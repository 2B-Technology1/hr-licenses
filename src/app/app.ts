import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrowserTitleService, RouteLoadingService } from '@mohammed_a4rf/core-ui';
import { CustomToastComponent, NavigationHistoryService } from '@mohammed_a4rf/core-ui/shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CustomToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly browserTitle = inject(BrowserTitleService);
  private readonly routeLoading = inject(RouteLoadingService);
  private readonly navigationHistory = inject(NavigationHistoryService);

  ngOnInit(): void {
    this.browserTitle.start();
    this.routeLoading.start();
    this.navigationHistory.startTracking();
  }
}
