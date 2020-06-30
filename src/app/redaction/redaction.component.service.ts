import { Injectable, ElementRef } from "@angular/core";
import { MarkupCommonService, htmlAttributes } from "../services/markupCommon.service";
import { RegexMarkupService } from "../services/regexMarkup.service";
import { IGroup, TextSelection, IHighlightedTextMultipleInstancesObject, ITextSelectionObject } from "../interfaces/redaction.component";
import { orderBy, find } from "lodash-es";

export interface IEntityTextGrouping {
  text: string;
  group: string;
}

@Injectable({
  providedIn: "root",
})
export class RedactionComponentService {

  constructor(
    private markupCommonService: MarkupCommonService,
    private regexMarkupService: RegexMarkupService
  ) {}

  public manualRedactText(
    redactionText: string,
    editableConentEl: ElementRef,
    openMultiSelectDialog: (matches: number, textSelection: TextSelection) => void
  ): [IGroup, string] | undefined {
    const selectedText: Selection | null = this.markupCommonService.getSelection();
    this.markupCommonService.getTextSelection(selectedText);
    this.markupCommonService.trimSpacesFromSelection(selectedText);
    if (selectedText && selectedText.anchorOffset !== selectedText.focusOffset) {
      const textSelection = this.markupCommonService.setManualMarkupTextSelection(selectedText, false);
      if (textSelection) {
        return this.checkMultipleMatchesAndMarkup(
          textSelection,
          editableConentEl,
          redactionText,
          openMultiSelectDialog
        );
      }
    }
    return undefined;
  }

  public automaticRedactText(redactionText, groupTypes): [IGroup[], string] {
    // Ensure paragraphs are broken by newlines then strip out html before sending.
    const html = "<div>" + redactionText.replace(/(<\/?div>|<\/?p>|<br>)/g, "$1\n") + "</div>";
    const text = $(html).text();
    const textGroupings = orderBy(
      this.regexMarkupService.getRedaction(text),
      (group: IEntityTextGrouping): number =>  group.text.length,
      "desc"
    );

    const redactionGroupings = textGroupings.reduce((groups: IGroup[], textGrouping: IEntityTextGrouping): IGroup[] => {
      // .filter((textGrouping: IEntityTextGrouping) => textGrouping.text)
      // .map((textGrouping: IEntityTextGrouping) => {
        // Find the text and markup.
        if (textGrouping.text) {
          const groupUuid = this.markupCommonService.createUUID();
          const type = find(groupTypes, {name: textGrouping.group});
          let returnObj: {group: IGroup, updatedRedactionText: string} | undefined;
          if (type) {
            returnObj = this.markupMultipleTextSelections(
              redactionText,
              groupUuid,
              textGrouping.text,
              type.label,
              textGrouping.group,
              "#000000",
              textGrouping.text
            );

            // redactionText = updatedRedactionText;
            // return group;
          } else {
            returnObj = this.markupMultipleTextSelections(
              redactionText,
              groupUuid,
              textGrouping.text,
              "",
              textGrouping.group,
              "#000000",
              textGrouping.text
            );
          }
          if (returnObj) {
            redactionText = returnObj.updatedRedactionText;
            groups.push(returnObj.group);
            return groups;
          }
        }

        return groups;
      },
      []
    );

    return [redactionGroupings, redactionText];
  }

  public redactSpans(editableConentEl: ElementRef, standardRedactionLength: boolean, showLabel: boolean): string {
    const redactedSpans: HTMLElement[] = editableConentEl.nativeElement.querySelectorAll("span[text-selection-uuid]");
    redactedSpans.forEach((redactedSpan: HTMLElement): void => {
      redactedSpan.setAttribute("style", "background-color: black; color: white");
      redactedSpan.setAttribute("class", "redacted-text");
      redactedSpan.removeAttribute("group-label");
      redactedSpan.removeAttribute("group-type-name");
      if (!redactedSpan.getAttribute("redacted")) {
        if (standardRedactionLength) {
          redactedSpan.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        } else {
          redactedSpan.innerHTML = redactedSpan.innerHTML.replace(/\S|\s/g, "&nbsp;&nbsp;");
        }
        if (showLabel) {
          const context = redactedSpan.getAttribute("group-comment");
          if (context) {
            if (context.length > this.patternCounter(redactedSpan.innerHTML, /&nbsp;&nbsp;/g)) {
              redactedSpan.innerHTML = context;
            } else {
              // Add the context and remove context.length number of whitespaces
              // whitespace pattern is 12 characters long hence * 12
              redactedSpan.innerHTML = context + redactedSpan.innerHTML.substring((context.length * 12));
            }
            redactedSpan.removeAttribute("group-comment");
          }
        }
      }
      redactedSpan.setAttribute("redacted", "true");
    });

    return editableConentEl.nativeElement.innerHTML;
    // this.textSelected = false;
    // this.messageService.success(this.Resources.sim.redaction.completeRedaction.info.msg, SASMessageOrientation.TOP, 4 * 1000);
  }

  public removeRedactGroup(
    target: HTMLElement,
    editableConentEl: ElementRef,
    redactionGroups: IGroup[],
    selectedGroupUuid?: string
  ): {redactionGroups: IGroup[], clearSelectedGroup: boolean} {
    if (target.nodeName === "SPAN" && target.hasAttribute("group-uuid") && !target.hasAttribute("redacted")) {
      const uuid = target.getAttribute("group-uuid");
      const spans = editableConentEl.nativeElement.querySelectorAll("span[group-uuid='" + uuid + "']");
      $(spans).contents().unwrap();
      const selected = this.markupCommonService.getSelection();
      if (selected) {
        // Clean up
        selected.removeAllRanges();
      }
      return {
        redactionGroups: redactionGroups.filter(group => group.groupUuid !== uuid),
        clearSelectedGroup: uuid === selectedGroupUuid
      };
    } else {
      return {
        redactionGroups,
        clearSelectedGroup: false
      };
    }
  }

  public removeRedactionGroup(
    selectedGroup: IGroup,
    editableConentEl: ElementRef,
    redactionGroups: IGroup[],
  ): IGroup[] {
    const spans = editableConentEl.nativeElement.querySelectorAll("span[group-uuid='" + selectedGroup.groupUuid + "']");
    $(spans).contents().unwrap();
    return redactionGroups.filter(group => group.groupUuid !== selectedGroup.groupUuid);
  }

  public highlightText(
    isManualRedact: boolean,
    target: HTMLElement,
    redactionGroups: IGroup[],
    onSelectGroup: (event: {selectedRows: any[]}) => void,
    redactionText: string,
    editableConentEl: ElementRef,
    openMultiSelectDialog: (matches: number, textSelection: TextSelection) => void
  ): [IGroup, string] | undefined {
    this.markupCommonService.highlightSelectedGroup(target, redactionGroups, onSelectGroup);
    if (isManualRedact) {
      return this.manualRedactText(redactionText, editableConentEl, openMultiSelectDialog);
    } else {
      return undefined;
    }
    // return this.checkTextSelected();
  }

  public highlightSelectedGroup(editableConentEl: ElementRef, selectedRedactionGroup) {
    const unSelectedSpans = editableConentEl.nativeElement.querySelectorAll("span.selected-span");
    $(unSelectedSpans).removeClass("selected-span");
    const selectedSpans = editableConentEl.nativeElement.querySelectorAll("span[group-uuid='" + selectedRedactionGroup.groupUuid + "']");
    $(selectedSpans).addClass("selected-span");
  }

  public updateSelectedGroupComment(
    redactionGroup: IGroup,
    newGroupComment: string,
    editableConentEl: ElementRef
  ): void {
    if (redactionGroup.groupComment !== newGroupComment) {
      redactionGroup.groupComment = newGroupComment;
      const selectedSpans = editableConentEl.nativeElement.querySelectorAll("span[group-uuid='" + redactionGroup.groupUuid + "']");
      $(selectedSpans).attr(htmlAttributes.groupComment, newGroupComment);
    }
  }

  private patternCounter(str: string, pattern: RegExp): number {
    return ((str || "").match(pattern) || []).length;
  }

  // // Used to check if text currently selected.
  // private checkTextSelected(): boolean {
  //   const selected: Selection | null = this.markupCommonService.getSelection();
  //   return selected?.toString().trim().length > 0;
  // }

  private checkMultipleMatchesAndMarkup(
    textSelection: TextSelection,
    editableConentEl: ElementRef,
    redactionText: string,
    openMultiSelectDialog: (matches: number, textSelection: TextSelection) => void
  ): [IGroup, string] | undefined {
    const matches = this.markupCommonService.getTextSelectionMatchesFound(
      textSelection.selectedString,
      redactionText
    );
    if (matches > 0) {
        openMultiSelectDialog(matches, textSelection);
        return undefined;
    } else {
      return this.markUpText(redactionText, textSelection, editableConentEl, textSelection.selectedString);
    }
  }

  // Used to markup the text selected by the user.
  public markUpText(
    redactionText: string,
    textSelection: TextSelection,
    editableConentEl: ElementRef,
    groupLabel: string = "",
    includeFoundTextSelections: boolean = false,
    selectedInstances?: IHighlightedTextMultipleInstancesObject[],
    groupColor: string = "black",
    groupUuid?: string,
    groupComment: string = "",
    groupTypeName: string = "",
  ): [IGroup, string] | undefined {
    if (groupUuid) {
        const spans = editableConentEl.nativeElement.querySelectorAll("span[group-uuid='" + groupUuid + "']");
        $(spans)
          .attr("group-label", groupLabel)
          .attr("group-comment", groupComment)
          .attr("group-type-name", groupTypeName);
    } else {
        groupUuid = this.markupCommonService.createUUID();
    }

    if (includeFoundTextSelections && textSelection) {
      const returnObj: {group: IGroup, updatedRedactionText: string} | undefined = this.markupMultipleTextSelections(
        redactionText,
        groupUuid,
        groupLabel,
        groupComment,
        groupTypeName,
        groupColor,
        textSelection.selectedString,
        selectedInstances
      );

      // editableConentEl.nativeElement.innerHTML = updatedRedactionText;
      if (returnObj) {
        return [returnObj.group, returnObj.updatedRedactionText];
      } else {
        return undefined;
      }
    } else if (textSelection) {
      const element = this.markupCommonService.createTextSelectionElement(groupUuid, groupLabel, groupComment, groupTypeName, groupColor);
      textSelection.range.surroundContents(element);
      return [{
        groupUuid,
        groupLabel,
        groupComment,
        groupTypeName,
        groupTypeLabel: null,
        groupTypeLinkEntity: null,
        groupColor,
        textSelections: [{
          groupUuid,
          textSelectionUuid: element.getAttribute(htmlAttributes.textSelectionUuid),
          selectedText: element.textContent
        }],
      }, redactionText];
    }
  }

  private markupMultipleTextSelections(
    redactionText: string,
    groupUuid: string,
    groupLabel: string,
    groupComment: string,
    groupTypeName: string,
    groupColor: string,
    foundTextString: string,
    selectedInstances?: IHighlightedTextMultipleInstancesObject[]
  ): {group: IGroup, updatedRedactionText: string} | undefined {
    // Find all instances that match the text selections that are not in spans and make text selections.
    let pos = redactionText.indexOf(foundTextString);
    let currentMatch = 0;
    const textSelections: ITextSelectionObject[] = [];
    while (pos > -1) {
      if ((
        !selectedInstances &&
        !this.markupCommonService.isFoundTextInSpan(redactionText, pos, foundTextString) ||
        (
          selectedInstances &&
          currentMatch < selectedInstances.length &&
          selectedInstances[currentMatch].redact &&
          !this.markupCommonService.isFoundTextInSpan(redactionText, pos, foundTextString))
      )) {
        const [
          updateRedactionText,
          newPos,
          textSelectionUuid,
          selectedText
        ] = this.markupCommonService.replaceTextSelectionWithElement(
          pos,
          foundTextString,
          redactionText,
          groupUuid,
          groupLabel,
          groupComment,
          groupTypeName,
          groupColor
        );
        redactionText = updateRedactionText;
        pos = newPos;

        textSelections.push({
          groupUuid,
          textSelectionUuid,
          selectedText
        });
      }
      if (!this.markupCommonService.isFoundTextInSpan(redactionText, pos, foundTextString)) {
        currentMatch++;
      }
      pos = redactionText.indexOf(foundTextString, pos + 1);
    }

    if (textSelections.length > 0) {
      return {
          group: {
          groupUuid,
          groupLabel,
          groupComment,
          groupTypeName,
          groupTypeLabel: null,
          groupTypeLinkEntity: null,
          groupColor,
          textSelections,
        },
        updatedRedactionText: redactionText
      };
    } else {
      return undefined;
    }
  }
}
