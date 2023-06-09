import { CODES, KEYS } from "../keys";
import { register } from "./register";
import {
  copyTextToSystemClipboard,
  copyToClipboard,
  probablySupportsClipboardBlob,
  probablySupportsClipboardWriteText,
} from "../clipboard";
import { actionDeleteSelected } from "./actionDeleteSelected";
import { getSelectedElements } from "../scene/selection";
import { exportCanvas } from "../data/index";
import { getNonDeletedElements, isTextElement } from "../element";
import { t } from "../i18n";

export const actionCopy = register({
  name: "copy",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    const elementsToCopy = getSelectedElements(elements, appState, {
      includeBoundTextElement: true,
      includeElementsInFrames: true,
    });

    copyToClipboard(elementsToCopy, app.files);

    return {
      commitToHistory: false,
    };
  },
  predicate: (elements, appState, appProps, app) => {
    return app.device.isMobile && !!navigator.clipboard;
  },
  contextItemLabel: "labels.copy",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined,
});

export const actionPaste = register({
  name: "paste",
  trackEvent: { category: "element" },
  perform: (elements: any, appStates: any, data, app) => {
    app.pasteFromClipboard(null);
    return {
      commitToHistory: false,
    };
  },
  predicate: (elements, appState, appProps, app) => {
    return app.device.isMobile && !!navigator.clipboard;
  },
  contextItemLabel: "labels.paste",
  // don't supply a shortcut since we handle this conditionally via onCopy event
  keyTest: undefined,
});

export const actionCut = register({
  name: "cut",
  trackEvent: { category: "element" },
  perform: (elements, appState, data, app) => {
    actionCopy.perform(elements, appState, data, app);
    return actionDeleteSelected.perform(elements, appState);
  },
  predicate: (elements, appState, appProps, app) => {
    return app.device.isMobile && !!navigator.clipboard;
  },
  contextItemLabel: "labels.cut",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.X,
});

export const actionCopyAsSvg = register({
  name: "copyAsSvg",
  trackEvent: { category: "element" },
  perform: async (elements, appState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false,
      };
    }
    const selectedElements = getSelectedElements(
      getNonDeletedElements(elements),
      appState,
      {
        includeBoundTextElement: true,
        includeElementsInFrames: true,
      },
    );
    try {
      await exportCanvas(
        "clipboard-svg",
        selectedElements.length
          ? selectedElements
          : getNonDeletedElements(elements),
        appState,
        app.files,
        appState,
      );
      return {
        commitToHistory: false,
      };
    } catch (error: any) {
      console.error(error);
      return {
        appState: {
          ...appState,
          errorMessage: error.message,
        },
        commitToHistory: false,
      };
    }
  },
  predicate: (elements) => {
    return probablySupportsClipboardWriteText && elements.length > 0;
  },
  contextItemLabel: "labels.copyAsSvg",
});

export const actionCopyAsPng = register({
  name: "copyAsPng",
  trackEvent: { category: "element" },
  perform: async (elements, appState, _data, app) => {
    if (!app.canvas) {
      return {
        commitToHistory: false,
      };
    }
    const selectedElements = getSelectedElements(
      getNonDeletedElements(elements),
      appState,
      {
        includeBoundTextElement: true,
        includeElementsInFrames: true,
      },
    );
    try {
      await exportCanvas(
        "clipboard",
        selectedElements.length
          ? selectedElements
          : getNonDeletedElements(elements),
        appState,
        app.files,
        appState,
      );
      return {
        appState: {
          ...appState,
          toast: {
            message: t("toast.copyToClipboardAsPng", {
              exportSelection: selectedElements.length
                ? t("toast.selection")
                : t("toast.canvas"),
              exportColorScheme: appState.exportWithDarkMode
                ? t("buttons.darkMode")
                : t("buttons.lightMode"),
            }),
          },
        },
        commitToHistory: false,
      };
    } catch (error: any) {
      console.error(error);
      return {
        appState: {
          ...appState,
          errorMessage: error.message,
        },
        commitToHistory: false,
      };
    }
  },
  predicate: (elements) => {
    return probablySupportsClipboardBlob && elements.length > 0;
  },
  contextItemLabel: "labels.copyAsPng",
  keyTest: (event) => event.code === CODES.C && event.altKey && event.shiftKey,
});

export const copyText = register({
  name: "copyText",
  trackEvent: { category: "element" },
  perform: (elements, appState) => {
    const selectedElements = getSelectedElements(
      getNonDeletedElements(elements),
      appState,
      {
        includeBoundTextElement: true,
      },
    );

    const text = selectedElements
      .reduce((acc: string[], element) => {
        if (isTextElement(element)) {
          acc.push(element.text);
        }
        return acc;
      }, [])
      .join("\n\n");
    copyTextToSystemClipboard(text);
    return {
      commitToHistory: false,
    };
  },
  predicate: (elements, appState) => {
    return (
      probablySupportsClipboardWriteText &&
      getSelectedElements(elements, appState, {
        includeBoundTextElement: true,
      }).some(isTextElement)
    );
  },
  contextItemLabel: "labels.copyText",
});
