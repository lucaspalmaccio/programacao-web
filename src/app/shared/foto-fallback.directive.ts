import { Directive, HostListener, ElementRef } from '@angular/core';

const PADRAO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250">' +
    '<rect width="200" height="250" fill="#faf6f0"/>' +
    '<path d="M92 30h16v40c0 12 22 24 22 52v100a10 10 0 0 1-10 10H80a10 10 0 0 1-10-10V122c0-28 22-40 22-52z" fill="#e6d9c8"/>' +
    '<rect x="78" y="150" width="44" height="46" rx="3" fill="#c9a24b" opacity=".6"/>' +
    '</svg>'
  );

/** Troca imagens que não carregam por uma garrafa neutra, sem ícone quebrado. */
@Directive({
  selector: 'img[appFotoFallback]',
  standalone: true
})
export class FotoFallbackDirective {
  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  aoFalhar(): void {
    const img = this.el.nativeElement;
    if (img.src !== PADRAO) {
      img.src = PADRAO;
    }
  }
}
