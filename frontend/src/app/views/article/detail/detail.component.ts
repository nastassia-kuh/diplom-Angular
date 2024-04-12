import {Component, OnDestroy, OnInit} from '@angular/core';
import {ArticleService} from "../../../shared/services/article.service";
import {ActivatedRoute} from "@angular/router";
import {ArticleType, CommentType, OtherCommentType} from "../../../../types/article.type";
import {BlogType} from "../../../../types/blog.type";
import {AuthService} from "../../../core/auth/auth.service";
import {CommentService} from "../../../shared/services/comment.service";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {MatSnackBar} from "@angular/material/snack-bar";
import {LoaderService} from "../../../shared/services/loader.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {

  articleDetail!: ArticleType;
  relatedArticles: BlogType[] = [];
  isLogged: boolean = false;
  isShowedLoadForComments = false;
  newComment: string = '';
  allCounts: number = 0;
  quantityInArrayOfComments: number = 0;
  afterClickHowManyCommentsStay: number = 0;
  observableAuthService: Subscription = new Subscription();
  observableActivatedRoute: Subscription = new Subscription();
  observableActivatedRouteTwo: Subscription = new Subscription();
  observableArticleService: Subscription = new Subscription();
  observableArticleServiceGetRelated: Subscription = new Subscription();
  observableArticleServiceGetArticle: Subscription = new Subscription();
  observableCommentService: Subscription = new Subscription();
  observableCommentServiceAdd: Subscription = new Subscription();


  constructor(private articleService: ArticleService,
              private commentService: CommentService,
              private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private _snackBar: MatSnackBar,
              private loaderService: LoaderService) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit() {
    this.observableAuthService = this.authService.isLogged$.subscribe((data: boolean) => {
      this.isLogged = data;
    });

    this.observableActivatedRoute = this.activatedRoute.params.subscribe(params => {
      this.observableArticleService = this.articleService.getArticle(params['url'])
        .subscribe((data: ArticleType) => {
          this.articleDetail = data;
          this.allCounts = data.commentsCount;
          this.quantityInArrayOfComments = this.articleDetail.comments.length;

          if (this.articleDetail.commentsCount > 3) {
            this.isShowedLoadForComments = true;
          }


        });

      this.observableArticleServiceGetRelated = this.articleService.getRelatedArticles(params['url'])
        .subscribe((data: BlogType[]) => {
          this.relatedArticles = data;
        });

    });


  }

  loadOtherComments(): void {
    this.loaderService.show();
    this.observableCommentService = this.commentService.getComments(this.quantityInArrayOfComments, this.articleDetail.id)
      .subscribe((data: OtherCommentType) => {

        data.comments.forEach((item: CommentType) => {
          this.articleDetail.comments.push(item);
        });

        this.loaderService.hide();
        this.quantityInArrayOfComments = this.articleDetail.comments.length;
        this.afterClickHowManyCommentsStay = this.allCounts - this.quantityInArrayOfComments;

        this.isShowedLoadForComments = this.afterClickHowManyCommentsStay > 0;

      });

  }

  addComment(): void {
    this.observableCommentServiceAdd = this.commentService.addComment(this.newComment, this.articleDetail.id)
      .subscribe((data: DefaultResponseType) => {
        if (!data.error) {
          this._snackBar.open('Комментарий добавлен');
          this.newComment = '';
          //

          this.observableActivatedRouteTwo = this.activatedRoute.params.subscribe(params => {
            this.observableArticleServiceGetArticle = this.articleService.getArticle(params['url'])
              .subscribe((data: ArticleType) => {
                this.articleDetail = data;
                this.allCounts = data.commentsCount;
                this.quantityInArrayOfComments = this.articleDetail.comments.length;

                if (this.articleDetail.commentsCount > 3) {
                  this.isShowedLoadForComments = true;
                }

              });

          });

          //

        } else {
          this._snackBar.open('Упс. Что-то пошло не так. Попробуйте оставить комментарий позже')
        }
      });
  }

  share(social: string): void {

    let url_soc: string = '';

    switch(social) {
      case 'vk':
      // вместо 'https://vk-book.ru/' должна быть взята ссылка на данную статью полностью. Тут как пример работы реализовано //
      url_soc = 'https://vk.com/share.php?url=' + 'https://vk-book.ru/';
      break;
      case 'fb':
      url_soc = 'https://www.facebook.com/sharer/sharer.php?u=' + 'https://vk-book.ru/';
      break;
    }

    if (url_soc) {
      // размеры окна
      let width = 800, height = 500;
      // центруем окно
      let left = (window.screen.width - width) / 2;
      let top = (window.screen.height - height) / 2;
      // открываем окно
      let social_window = window.open(url_soc, "share_window", "height=" + height + ",width=" + width + ",top=" + top + ",left=" + left);
      // устанавливаем на окно фокус
      social_window!.focus();
    }

  }

  ngOnDestroy() {
    this.observableAuthService.unsubscribe();
    this.observableActivatedRoute.unsubscribe();
    this.observableArticleService.unsubscribe();
    this.observableArticleServiceGetRelated.unsubscribe();
    this.observableCommentService.unsubscribe();
    this.observableCommentServiceAdd.unsubscribe();
    this.observableActivatedRouteTwo.unsubscribe();
    this.observableArticleServiceGetArticle.unsubscribe();
  }

}
