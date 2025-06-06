import Vue from "vue";
import wrap from "@vue/web-component-wrapper";
import Component from "./SqlTextEditor.vue";

export const SqlTextEditorElement = wrap(Vue, Component, { disableShadowDom: true }) as unknown as CustomElementConstructor;
