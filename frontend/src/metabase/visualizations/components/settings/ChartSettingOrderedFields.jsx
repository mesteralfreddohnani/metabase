import React, { Component } from "react";
import { t } from "c-3po";

import CheckBox from "metabase/components/CheckBox.jsx";
import Icon from "metabase/components/Icon.jsx";
import PopoverWithTrigger from "metabase/components/PopoverWithTrigger";
import FieldList from "metabase/query_builder/components/FieldList";

import { SortableContainer, SortableElement } from "react-sortable-hoc";

import StructuredQuery from "metabase-lib/lib/queries/StructuredQuery";
import {
  fieldRefForColumn,
  findColumnForColumnSetting,
} from "metabase/lib/dataset";
import { getFriendlyName } from "metabase/visualizations/lib/utils";

import cx from "classnames";
import _ from "underscore";

const SortableColumn = SortableElement(
  ({ columnSetting, getColumnName, onRemove }) => (
    <ColumnItem
      title={getColumnName(columnSetting)}
      onRemove={() => onRemove(columnSetting)}
    />
  ),
);

const SortableColumnList = SortableContainer(
  ({ columnSettings, getColumnName, onRemove }) => {
    return (
      <div>
        {columnSettings.map((columnSetting, index) => (
          <SortableColumn
            key={`item-${index}`}
            index={columnSetting.index}
            columnSetting={columnSetting}
            getColumnName={getColumnName}
            onRemove={onRemove}
          />
        ))}
      </div>
    );
  },
);

export default class ChartSettingOrderedColumns extends Component {
  handleEnable = columnSetting => {
    const columnSettings = [...this.props.value];
    const index = columnSetting.index;
    columnSettings[index] = { ...columnSettings[index], enabled: true };
    this.props.onChange(columnSettings);
  };

  handleDisable = columnSetting => {
    const columnSettings = [...this.props.value];
    const index = columnSetting.index;
    columnSettings[index] = { ...columnSettings[index], enabled: false };
    this.props.onChange(columnSettings);
  };

  handleSortEnd = ({ oldIndex, newIndex }) => {
    const fields = [...this.props.value];
    fields.splice(newIndex, 0, fields.splice(oldIndex, 1)[0]);
    this.props.onChange(fields);
  };

  getColumnName = columnSetting =>
    getFriendlyName(
      findColumnForColumnSetting(this.props.columns, columnSetting) || {
        display_name: "[Unknown]",
      },
    );

  render() {
    const { value, question, addField, columns, columnNames } = this.props;

    let additionalFieldOptions = { count: 0 };
    if (columns && question && question.query() instanceof StructuredQuery) {
      const fieldRefs = columns.map(column => fieldRefForColumn(column));
      additionalFieldOptions = question.query().dimensionOptions(dimension => {
        const mbql = dimension.mbql();
        return !_.find(fieldRefs, fieldRef => _.isEqual(fieldRef, mbql));
      });
    }

    const [enabledColumns, disabledColumns] = _.partition(
      value.map((columnSetting, index) => ({ ...columnSetting, index })),
      columnSetting => columnSetting.enabled,
    );

    return (
      <div className="list">
        <div>{t`Click and drag to change their order`}</div>
        {enabledColumns.length > 0 ? (
          <SortableColumnList
            columnSettings={enabledColumns}
            getColumnName={this.getColumnName}
            onRemove={this.handleDisable}
            onSortEnd={this.handleSortEnd}
            distance={5}
            helperClass="z5"
          />
        ) : (
          <div className="my2 p2 flex layout-centered bg-grey-0 text-grey-1 text-bold rounded">
            {t`Add fields from the list below`}
          </div>
        )}
        {disabledColumns.length > 0 || additionalFieldOptions.count > 0 ? (
          <h4 className="mb2 mt4">{`More fields`}</h4>
        ) : null}
        {disabledColumns.map(columnSetting => (
          <ColumnItem
            title={this.getColumnName(columnSetting)}
            onAdd={() => this.handleEnable(columnSetting)}
          />
        ))}
        {additionalFieldOptions.count > 0 && (
          <div>
            {additionalFieldOptions.dimensions.map(dimension => (
              <ColumnItem
                title={dimension.displayName()}
                onAdd={() => addField(dimension.mbql())}
              />
            ))}
            {additionalFieldOptions.fks.map(fk => (
              <div>
                <div className="my2 text-grey-4 text-bold text-uppercase text-small">
                  {fk.field.target.table.display_name}
                </div>
                {fk.dimensions.map(dimension => (
                  <ColumnItem
                    title={dimension.displayName()}
                    onAdd={() => addField(dimension.mbql())}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

const ColumnItem = ({ title, onAdd, onRemove }) => (
  <div
    className="my1 bordered rounded shadowed cursor-pointer overflow-hidden bg-white"
    onClick={onAdd}
  >
    <div className="p1 border-bottom relative">
      <div className="px1 flex align-center relative">
        <span className="h4 flex-full text-dark">{title}</span>
        {onAdd && (
          <Icon
            name="add"
            className="cursor-pointer text-grey-1 text-grey-4-hover"
            onClick={e => {
              e.stopPropagation();
              onAdd();
            }}
          />
        )}
        {onRemove && (
          <Icon
            name="close"
            className="cursor-pointer text-grey-1 text-grey-4-hover"
            onClick={e => {
              e.stopPropagation();
              onRemove();
            }}
          />
        )}
      </div>
    </div>
  </div>
);
