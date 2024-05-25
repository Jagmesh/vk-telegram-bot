export class Translit {
  private static maxTextLength = 25;

  static ruToEng(string: string): string {
    const lettersMap = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ё: 'e',
      ж: 'zh',
      з: 'z',
      и: 'i',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'o',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'x',
      ц: 'ts',
      ч: 'ch',
      ш: 'sh',
      щ: 'sch',
      ъ: '',
      ы: 'i',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya',
    };

    return string
      .toLowerCase()
      .split('')
      .map((el) => {
        if (lettersMap[el]) el = lettersMap[el];
        return el;
      })
      .join('')
      .slice(0, this.maxTextLength)
      .replaceAll(' ', '_')
      .replace(/[^a-zA-Z _]/g, '');
  }
}
