<template>
  <div class="BksUiKit BksTextEditor BksSqlTextEditor">
    <textarea
      name="editor"
      class="BksTextEditor-textarea BksSqlTextEditor-textarea editor"
      ref="editor"
      id=""
      cols="30"
      rows="10"
    />
  </div>
</template>

<script lang="ts">
import _ from "lodash";
import Vue from "vue";
import textEditorMixin from "../../text-editor/v1/mixin";
import { format } from "sql-formatter";
import { autoquote, autoComplete, autoRemoveQueryQuotes } from "./plugins";
import { querySelection, QuerySelectionChangeParams } from "./querySelectionPlugin";
import ProxyEmit from "../../mixins/ProxyEmit";
import { InternalContextItem, divider } from "../../context-menu/menu";
import props from "../v2/props";

export default Vue.extend({
  mixins: [textEditorMixin, ProxyEmit],
  props,
  computed: {
    hintOptions() {
      // We do this so we can order the autocomplete options
      const firstTables = {};
      const secondTables = {};
      const thirdTables = {};

      this.entities.forEach((table) => {
        const columns = table.columns?.map((c) => c.field) ?? [];
        // don't add table names that can get in conflict with database schema
        if (/\./.test(table.name)) return;

        // Previously we had to provide a table: column[] mapping.
        // we don't need to provide the columns anymore because we fetch them dynamically.
        if (!table.schema) {
          firstTables[table.name] = columns;
          return;
        }

        if (table.schema === this.defaultSchema) {
          firstTables[table.name] = columns;
          secondTables[`${table.schema}.${table.name}`] = columns;
        } else {
          thirdTables[`${table.schema}.${table.name}`] = columns;
        }
      });

      const sorted = Object.assign(
        firstTables,
        Object.assign(secondTables, thirdTables)
      );

      return { tables: sorted };
    }
  },
  methods: {
    formatSql() {
      const formatted = format(this.value, {
        language: this.formatterDialect,
      });
      this.$emit("bks-value-change", { value: formatted });
    },
    contextMenuItemsModifier(_event, _target, items: InternalContextItem<unknown>[]): InternalContextItem<unknown>[] {
      const pivot = items.findIndex((o) => o.id === "find");
      return [
        ...items.slice(0, pivot),
        {
          label: `Format Query`,
          id: "text-format",
          handler: this.formatSql,
          shortcut: "Shift+F",
        },
        divider,
        ...items.slice(pivot),
      ];
    },
    handleQuerySelectionChange(params: QuerySelectionChangeParams) {
      this.$emit("bks-query-selection-change", params);
    },
  },
  mounted() {
    this.internalKeybindings["Shift-Ctrl-F"] = this.formatSql;
    this.internalKeybindings["Shift-Cmd-F"] = this.formatSql;
    this.internalContextMenuItems = this.contextMenuItemsModifier;
    this.plugins = [
      autoquote,
      autoComplete,
      autoRemoveQueryQuotes(this.identifierDialect),
      querySelection(this.identifierDialect, this.handleQuerySelectionChange),
    ]
  }
});
</script>
