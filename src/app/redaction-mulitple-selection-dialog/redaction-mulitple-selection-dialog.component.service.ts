import { Injectable } from "@angular/core";
import { IHighlightedTextMultipleInstancesObject } from "../interfaces/redaction.component";
import { MarkupCommonService } from "../services/markupCommon.service";

@Injectable({
    providedIn: "root"
})
export class RedactionMulitpleSelectionDialogComponentService {

  constructor(
    private markupCommonService: MarkupCommonService
  ) {}

  getMatchedTexts(
    redactionHtml,
    selectedText
  ): IHighlightedTextMultipleInstancesObject[] {
    const highlightedTextObjects: IHighlightedTextMultipleInstancesObject[] = [];
    const structuredTextHtml = redactionHtml;
    let pos = structuredTextHtml.indexOf(selectedText);
    while (pos > -1) {
      if (!this.markupCommonService.isFoundTextInSpan(structuredTextHtml, pos, selectedText)) {
        highlightedTextObjects.push({
          pos,
          sentence: this.findSentence(redactionHtml, pos, selectedText),
          redact: true,
          selectedText
        });
      }
      pos = structuredTextHtml.indexOf(selectedText, pos + 1);
    }

    return highlightedTextObjects;
  }

  private findSentence(redactionHtml: string, pos: number, selectedText: string): string {
    let startSentencePos = pos;
    let endSentencePos = pos;
    let count = 0;
    let startInSpan = false;
    let endInSpan = false;
    while (
      this.detectSentenceBoundary(redactionHtml, startSentencePos, startInSpan) &&
      count < redactionHtml.length &&
      startSentencePos > 0
    ) {
      if (redactionHtml.charAt(startSentencePos).match(/>/)) {
        startInSpan = true;
      }
      if (redactionHtml.charAt(startSentencePos).match(/</)) {
        startInSpan = false;
      }
      count += 1;
      startSentencePos -= 1;
    }

    count = 0;
    while (
      this.detectSentenceBoundary(redactionHtml, endSentencePos, endInSpan) &&
      count < redactionHtml.length
    ) {
      if (redactionHtml.charAt(endSentencePos).match(/>/)) {
        endInSpan = true;
      }
      if (redactionHtml.charAt(endSentencePos).match(/</)) {
        endInSpan = false;
      }
      count += 1;
      endSentencePos += 1;
    }

    let sentence = redactionHtml.substring(startSentencePos, endSentencePos + 1);
    const inSentenceTermOffSets = this.getInSentenceSelectedTermOffSets(sentence, selectedText);

    // Replace the particular occurrence of the selected text in that sentence, there could be more than one occurrence of the selected text
    // in the sentence so I need to figure out which one it is, with a span.
    inSentenceTermOffSets.forEach((offset: number) => {
      if (offset + startSentencePos === pos) {
        sentence = sentence.substring(0, offset) +
          "<span class=\"multiple-instance-highlight\">" +
          selectedText + "</span>" + sentence.substring(offset + selectedText.length);
      }
    });

    return this.trimSentence(sentence);
  }

  private getInSentenceSelectedTermOffSets(sentence: string, selectedText: string): number[] {
    const offsets = [];
    let pos = sentence.indexOf(selectedText);
    while (pos > -1) {
      offsets.push(pos);
      pos = sentence.indexOf(selectedText, pos + 1);
    }
    return offsets;
  }

  private trimSentence(sentence: string): string {
    return sentence.replace(/^([\s|.|!|?]|<div><br><\/div>)+|\s+$/g, "");
  }

  private detectSentenceBoundary(redactionHtml: string, pos: number, inSpan: boolean): boolean {
    if (redactionHtml.charAt(pos).match(/[.!?]/) && inSpan) {
      return false;
    }
    return !redactionHtml.charAt(pos).match(/[.!?]/);
  }
}
