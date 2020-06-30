import { Injectable } from "@angular/core";
import { unescape, includes, trimStart, trim, find } from "lodash-es";

class TextSelection {
  public range: Range;
  public selected: Selection;
  public selectedString: string;
}

export enum htmlAttributes {
  groupUuuid = "group-uuid",
  groupLabel = "group-label",
  groupComment = "group-comment",
  groupTypeName = "group-type-name",
  textSelectionUuid = "text-selection-uuid",
  groupColor = "group-color",
  style = "style",
  contenteditable = "contenteditable",
  link = "link",
  linkObjectUuid = "link-uuid",
  linkName = "link-name"
}

export const maxLengthTextSelection = 60;

@Injectable({
  providedIn: "root",
})
export class MarkupCommonService {

  public getSelection(): Selection | null {
    let selection: Selection | null = null;
    if (window.getSelection) {
      selection = window.getSelection();
    } else if (document.getSelection) {
      selection = document.getSelection();
    }
    return selection;
  }

  // In IE11 if you double click on a word it selects the word and any white space following it.
    // If there is a span after the whitespace it also manages to capture this.
    // Before we process the selection only capture the range up to the first span.
  public getTextSelection(selected: Selection | null): void {
    if (selected && selected.rangeCount && selected.rangeCount === 1) {
      const range = selected.getRangeAt(0);
      const startContainer = range.startContainer;
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());

      // If the inner html does not equal the innner text and we have a span then set the range to the text before the span.
      // IE11 trims spaces off the start of InnerText so may as well trim both innerHTML and innerText before comparing.
      if (
        startContainer.textContent &&
        container.innerHTML.indexOf("<span") > 0 &&
        container.innerHTML.trim() !== container.innerText.trim()
      ) {
        range.setEnd(range.startContainer, startContainer.textContent.length);
      }
    }
  }

  // It is easy for the user to acidentally select white space at the start or end.  Trim off this white space.
  public trimSpacesFromSelection(selected: Selection | null): void {
    if (selected && selected.rangeCount && selected.rangeCount === 1) {
      const range = selected.getRangeAt(0);
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());

      // IE11 trims spaces off the start of InnerText so may as well trim both innerHTML and innerText before comparing.
      if (container.innerHTML.trim() === container.innerText.trim() && startContainer.isSameNode(endContainer)) {
        const selectedtext = container.innerHTML;
        const leftTrim = trimStart(selectedtext);
        const startOffset = range.startOffset + (selectedtext.length - leftTrim.length);
        range.setStart(range.startContainer, startOffset);
        const endOffset = range.startOffset + trim(selectedtext).length;
        range.setEnd(range.endContainer, endOffset);
      }
    }
  }

  public setManualMarkupTextSelection(selected: Selection | null, enforceMaxLength: boolean): TextSelection | undefined {
    const maxLength = maxLengthTextSelection;
    if (selected && selected.toString().trim().length === 0) {
      // this.messageService.warning(this.Resources.sim.markup.warningNoTextSelected.info.msg, SASMessageOrientation.TOP);
    } else if (enforceMaxLength && selected && selected.toString().trim().length > maxLength) {
      // const msg = this.resourceService.getResource("sim.markup.warningLengthExceeded.info.msg", {maxLength: maxLength.toString()});
      // this.messageService.warning(msg, SASMessageOrientation.TOP);
    } else if (selected && this.selectionContainsSpan(selected)) {
      // this.messageService.warning(this.Resources.sim.markup.warningContainsMakedUpText.info.msg, SASMessageOrientation.TOP);
    } else if (selected && !this.isTextSelectionWithinNode(selected)) {
      // this.messageService.warning(this.Resources.sim.markup.warningMultipleSections.info.msg, SASMessageOrientation.TOP);
    } else if (selected && selected.toString().trim().length > 0) {
      const textSelection = new TextSelection();
      textSelection.selectedString = selected.toString();
      textSelection.range = selected.getRangeAt(0);
      textSelection.selected = selected;
      textSelection.selected.removeAllRanges();
      return textSelection;
    } else if (selected) {
        // Clean up
        selected.removeAllRanges();
    }
    return undefined;
  }

  public highlightSelectedGroup(target: HTMLElement, textSelectionGroups, onSelectGroup: (event: {selectedRows: any[]}) => void): void {
    if (target.nodeName === "SPAN" && target.hasAttribute("group-uuid")) {
      const groupUuid = target.getAttribute("group-uuid");
      const group = find(textSelectionGroups, {groupUuid});
      if (group) {
        onSelectGroup({selectedRows: [group]});
        target.blur();
      }
    }
  }

  public getTextSelectionMatchesFound(selectedString: string, structuredTextHtml: string): number {
    let matchesFound = 0;
    if (selectedString) {
      let pos = structuredTextHtml.indexOf(selectedString);
      while (pos > -1) {
        if (!this.isFoundTextInSpan(structuredTextHtml, pos, selectedString)) {
          // Only count this if we are not within a span.
          ++matchesFound;
        }
        pos = structuredTextHtml.indexOf(selectedString, pos + 1);
      }
      // Reduce the count by one as we should not include the text selection.
      if (matchesFound > 0) {
        --matchesFound;
      }
    }
    return matchesFound;
  }

  public createUUID(): string {
    const s: string[] = [];
    const hexDigits = "0123456789abcdef";

    for (let i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }

    // bits 12-15 of the time_hi_and_version field to 0010
    s[14] = "4";

    // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[19] = hexDigits.substr((s[19] && 0x3) || 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
}

  public isFoundTextInSpan(structuredTextHtml: string, pos: number, searchedText: string): boolean {
    // An edge case is that the searchText matches against an end span </span>.  For instance span, pan, spa, an, s.
    const endSpan = "</span>";
    if (structuredTextHtml.substr(pos - endSpan.indexOf(searchedText), endSpan.length) === endSpan ) {
      return true;
    }

    // If the end span </span> is not found after this match then it is not in a span.
    const endSpanPos = structuredTextHtml.indexOf(endSpan, pos);
    if (endSpanPos === -1) {
      return false;
    } else {
      // The end span is found.  If either no startspan is found or the start span is
      // after the end span then the searchedText is in a span
      const startSpanPos = structuredTextHtml.indexOf("<span", pos);
      return startSpanPos === -1 || startSpanPos > endSpanPos;
    }
  }

  private selectionContainsSpan(selected: Selection): boolean {
    let selectionContainsSpan = false;
    if (selected.rangeCount) {
      const container = document.createElement("div");
      for (let i = 0, len = selected.rangeCount; i < len; ++i) {
          const parentNode: Node | null = selected.getRangeAt(i).startContainer.parentNode;
          if (parentNode) {
              if (parentNode.nodeName === "SPAN") {
                  selectionContainsSpan = true;
              }
          }
          container.appendChild(selected.getRangeAt(i).cloneContents());
      }
      if (includes(container.innerHTML, "<span") || includes(container.innerHTML, "</span>")) {
          selectionContainsSpan = true;
      }
    }
    return selectionContainsSpan;
  }

  public isTextSelectionWithinNode(selected: Selection): boolean {
    let textSelectionWithinNode = false;
    if (selected && selected.rangeCount && selected.rangeCount === 1) {
      const range = selected.getRangeAt(0);
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());
      if (unescape(container.innerHTML).trim() === container.innerText.trim()) {
          textSelectionWithinNode = true;
      }
    }
    return textSelectionWithinNode;
  }

  public replaceTextSelectionWithElement(
    pos: number,
    foundTextString: string,
    structuredTextHtml: string,
    groupUuid: string,
    groupLabel: string,
    groupComment: string,
    groupTypeName: string,
    groupColor: string
  ): [string, number, string, string] {
    const endPosition = pos + foundTextString.length;
    const element = this.createTextSelectionElement(groupUuid, groupLabel, groupComment, groupTypeName, groupColor);
    element.innerText = foundTextString;
    return [
      structuredTextHtml.substring(0, pos) + element.outerHTML + structuredTextHtml.substring(endPosition),
      pos + element.outerHTML.length,
      element.getAttribute(htmlAttributes.textSelectionUuid),
      element.textContent
    ];
  }

  public createTextSelectionElement(
    groupUuid: string,
    groupLabel: string,
    groupComment: string,
    groupTypeName: string,
    groupColor: string
  ): HTMLElement {
    const textSelectionUuid = this.createUUID();
    const element: HTMLElement = document.createElement("span");
    element.setAttribute(htmlAttributes.groupUuuid, groupUuid);
    element.setAttribute(htmlAttributes.groupLabel, groupLabel);
    element.setAttribute(htmlAttributes.groupComment, groupComment);
    element.setAttribute(htmlAttributes.groupTypeName, groupTypeName);
    element.setAttribute(htmlAttributes.textSelectionUuid, textSelectionUuid);
    element.setAttribute(htmlAttributes.groupColor, groupColor);
    element.setAttribute(htmlAttributes.style, "border-color:" + groupColor + ";cursor:pointer");
    element.setAttribute(htmlAttributes.contenteditable, "false");
    return element;
  }
}
