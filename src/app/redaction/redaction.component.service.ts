import { Injectable, ElementRef } from "@angular/core";
import { MarkupCommonService, htmlAttributes } from "../services/markupCommon.service";
import { RegexMarkupService } from "../services/regexMarkup.service";
import { IGroup, TextSelection, IHighlightedTextMultipleInstancesObject } from "../interfaces/redaction.component";

@Injectable({
  providedIn: "root",
})
export class RedactionComponentService {

  constructor(
    private markupCommonService: MarkupCommonService,
    private regexMarkupService: RegexMarkupService
  ) {}

  public manualRedactText(redactionText, editableConentEl): IGroup[] {
    const selectedText: Selection | null = this.markupCommonService.getSelection();
    this.markupCommonService.getTextSelection(selectedText);
    this.markupCommonService.trimSpacesFromSelection(selectedText);
    if (selectedText && selectedText.anchorOffset !== selectedText.focusOffset) {
      const textSelection = this.markupCommonService.setManualMarkupTextSelection(selectedText, false);
      if (textSelection) {
        return this.checkMultipleMatchesAndMarkup(textSelection, editableConentEl, redactionText);
      }
    }
    return [];
  }

  public automaticRedactText(redactionText) {
  }

  public redactSpans(editableConentEl: ElementRef, standardRedactionLength: boolean, showLabel: boolean) {
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
    editableConentEl: ElementRef
  ): IGroup[] {
    this.markupCommonService.highlightSelectedGroup(target, redactionGroups, onSelectGroup);
    if (isManualRedact) {
      const newRedactionGroups: IGroup[] = this.manualRedactText(redactionText, editableConentEl);
      return redactionGroups.concat(newRedactionGroups);
    } else {
      return redactionGroups;
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

  private checkMultipleMatchesAndMarkup(textSelection: TextSelection, editableConentEl: ElementRef, redactionText: string): IGroup[] {
    const matches = this.markupCommonService.getTextSelectionMatchesFound(
      textSelection.selectedString,
      redactionText
    );
    // if (matches > 0) {
    //     this.multipleSelectionsDialog
    //       .show({
    //         redactionHtml: this.pageModel.data[this.attributes.dataSource],
    //         selectedText: selectedString,
    //         matches
    //       })
    //       .then((output: ISimMultipleSelectionsDialogOutput) => {
    //         this.markUpText("", selectedString, "", "", "", true, output.instancesToMarkup);
    //       })
    //       .catch(noop);
    // } else {
    return this.markUpText(redactionText, textSelection, editableConentEl, textSelection.selectedString);
    // }
  }

  // Used to markup the text selected by the user.
  private markUpText(
    redactionText: string,
    textSelection: TextSelection,
    editableConentEl: ElementRef,
    groupLabel: string = "",
    groupUuid?: string,
    groupComment: string = "",
    groupTypeName: string = "",
    groupColor: string = "black",
    includeFoundTextSelections: boolean = false,
    selectedInstances?: IHighlightedTextMultipleInstancesObject[]
  ): IGroup[] {
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
        this.markupMultipleTextSelections(
          redactionText,
          groupUuid,
          groupLabel,
          groupComment,
          groupTypeName,
          groupColor,
          textSelection.selectedString,
          selectedInstances
        );
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
        }];
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
  ): void {
    // Find all instances that match the text selections that are not in spans and make text selections.
    let pos = redactionText.indexOf(foundTextString);
    let currentMatch = 0;
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
        const values = this.markupCommonService.replaceTextSelectionWithElement(
          pos,
          foundTextString,
          redactionText,
          groupUuid,
          groupLabel,
          groupComment,
          groupTypeName,
          groupColor
        );
        redactionText = values[0];
        pos = values[1];
      }
      if (!this.markupCommonService.isFoundTextInSpan(redactionText, pos, foundTextString)) {
        currentMatch++;
      }
      pos = redactionText.indexOf(foundTextString, pos + 1);
    }
  }
}
