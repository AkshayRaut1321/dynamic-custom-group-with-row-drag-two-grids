import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ColDef,
  ColumnApi,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';

@Component({
  selector: 'simple-component',
  template: ` <i
    class="far fa-trash-alt"
    style="cursor: pointer"
    (click)="applyTransaction()"
  ></i>`,
})
export class SportRenderer implements ICellRendererAngularComp {
  private params!: ICellRendererParams;
  private value!: string;

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  applyTransaction() {
    this.params.api.applyTransaction({ remove: [this.params.node.data] });
  }

  refresh() {
    return false;
  }
}

@Component({
  selector: 'my-app',
  template: /*html */ `
    <button (click)="addItems(undefined)">Add Group To Right Grid</button> <div class="top-container">
    <div class="grid-wrapper ag-theme-alpine">
      <div class="panel panel-primary" style="margin-right: 10px;">
        <div class="panel-heading">Athletes</div>
        <div class="panel-body">
          <div id="eLeftGrid">
            <ag-grid-angular
              style="height: 100%;"
              [defaultColDef]="defaultColDef"
              rowSelection="multiple"
              [rowDragMultiRow]="true"
              [suppressRowClickSelection]="true"
              [getRowId]="getRowId"
              [rowDragManaged]="true"
              [suppressMoveWhenRowDragging]="true"
              [animateRows]="true"
              [rowData]="leftRowData"
              [columnDefs]="leftColumns"
              (gridReady)="onGridReady($event, 0)"
            >
            </ag-grid-angular>
          </div>
        </div>
      </div>
      
      <div class="panel panel-primary" style="margin-left: 10px;">
        <div class="panel-heading">Selected Athletes</div>
        <div class="panel-body">
          <div id="eRightGrid">
            <ag-grid-angular
              style="height: 400px;"
              [defaultColDef]="defaultColDef"
              [getRowId]="getRowId"
              [animateRows]="true"
              [columnDefs]="rightColumns"
              (gridReady)="onGridReady($event, 1)"
              [autoGroupColumnDef]="autoGroupColumnDef"
              [treeData]="true"
              [getDataPath]="getDataPath"
              (cellEditingStopped)="onCellEditingStopped($event)"
              (rowDragEnd)="onRowDragEnd($event)"
              [suppressMoveWhenRowDragging]="true"
              [rowDragManaged]="true"
              [groupDefaultExpanded]="-1"
              [suppressRowClickSelection]="true"
              [rowSelection]="'multiple'"
              [rowDragMultiRow]="true"
            >
            </ag-grid-angular>
          </div>
        </div>
      </div>
    </div>
  </div>`,
})
export class AppComponent {
  rawData: any[] = [
    {"id": 1, "athlete":"US player","age":27,"country":["US"],"year":2012,"date":"12/08/2012","sport":"Swimming","gold":4,"silver":2,"bronze":0,"total":6, "level": 1},
    {"id": 2, "athlete":"RU player","age":24,"country":["RU"],"year":2000,"date":"01/10/2000","sport":"Gymnastics","gold":2,"silver":1,"bronze":3,"total":6, "level": 1},
    {"id": 3, "athlete":"AU player","age":24,"country":["AU"],"year":2012,"date":"12/08/2012","sport":"Swimming","gold":1,"silver":3,"bronze":1,"total":5, "level": 1}
  ];
  leftRowData: any[] = [];
  rightRowData: any[] = [];
  leftApi!: GridApi;
  leftColumnApi!: ColumnApi;
  rightApi!: GridApi;

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
  };

  leftColumns: ColDef[] = [
    {
      rowDrag: true,
      maxWidth: 50,
      suppressMenu: true,
      rowDragText: (params, dragItemCount) => {
        if (dragItemCount > 1) {
          return dragItemCount + ' athletes';
        }
        return params.rowNode!.data.athlete;
      },
    },
    {
      colId: 'checkbox',
      maxWidth: 50,
      checkboxSelection: true,
      suppressMenu: true,
      headerCheckboxSelection: true
    },
    { field: 'athlete' },
    { field: 'sport' },
  ];

  rightColumns: ColDef[] = [
    {
      suppressMenu: true,
      maxWidth: 50,
      cellRenderer: SportRenderer,
    }
  ];
  
  public autoGroupColumnDef: ColDef = {
    minWidth: 200,
    headerName: "Country",
    editable:this.isCellEditable.bind(this),
    rowDrag: this.canRowDragLeftGrid.bind(this),
    cellRendererParams: {
      checkbox: this.hasCheckBox.bind(this),
      suppressCount: true
    }
  };

  @ViewChild('eLeftGrid') eLeftGrid: any;
  @ViewChild('eRightGrid') eRightGrid: any;
  @ViewChild('eMoveRadio') eMoveRadio: any;
  @ViewChild('eDeselectRadio') eDeselectRadio: any;
  @ViewChild('eSelectCheckbox') eSelectCheckbox: any;

  constructor(private http: HttpClient) {
    this.loadGrids();
  }

  loadGrids = () => {
    this.leftRowData = [...this.rawData];
    this.rightRowData = [];
  };

  getRowId = (params: GetRowIdParams) => {
    return params.data.id;
  }

  onGridReady(params: GridReadyEvent, side: number) {
    if (side === 0) {
      this.leftApi = params.api;
      (this.leftApi as any).side = 'left';
      this.leftColumnApi = params.columnApi;
    }

    if (side === 1) {
      this.rightApi = params.api;
      (this.rightApi as any).side = 'right';
      this.rightApi.setRowData(this.rightRowData);
      this.addGridDropZone();
    }
  }

  addGridDropZone() {
    const dropZoneParams = this.rightApi.getRowDropZoneParams({
      onDragStop: (params) => {
        let overNodeIndex = params.overIndex;
        if (!(overNodeIndex >= 0)) {
          if (params.overNode && params.overNode.data) {
            const overNodeData = params.overNode.data;
            if (overNodeData.parentId && overNodeData.parentId != '') {
              if (overNodeData.level === 2)
                overNodeIndex = this.rightRowData.findIndex(a=> a.id === overNodeData.id);
            }
          }
        }

        params.nodes.map(a => {
          this.rightRowData.splice(overNodeIndex, 0, JSON.parse(JSON.stringify(a.data)));
          const parentRowIndex = this.rightRowData.findIndex(a=> a.id === a.id);
          if(JSON.stringify(a.data.country) == JSON.stringify(['US'])) {
            this.rightRowData.splice(parentRowIndex+1, 0, {id: (crypto as any).randomUUID(), country: ['US', 'US01'], athlete: 'Test1', "level": 2, parentId: a.data.id, side: 'right'});
            this.rightRowData.splice(parentRowIndex+2, 0, {id: (crypto as any).randomUUID(), country: ['US', 'US02'], athlete: 'Test2', "level": 2, parentId: a.data.id, side: 'right'});
          }
          else if(JSON.stringify(a.data.country) == JSON.stringify(['RU'])) {
            this.rightRowData.splice(parentRowIndex+1, 0, {id: (crypto as any).randomUUID(), country: ['RU', 'RU01'], athlete: 'Test3', "level": 2, parentId: a.data.id, side: 'right'});
          }
          overNodeIndex++;
        });
        this.rightApi.setRowData(this.rightRowData);
      },
    });

    this.leftApi.addRowDropZone(dropZoneParams);
  }

  isCellEditable(params) {
    return params.data.customGroup;
  }

  
  getDataPath(data) {
    return data.country;
  }

  addItems(addIndex: number | undefined) {
    const newRow = this.createNewRowData();
    const newItems = [
      newRow
    ];
    this.rightRowData.push(newRow);
    const res = this.rightApi.applyTransaction({
      add: newItems,
      addIndex: addIndex,
    });
  }
  
  createNewRowData() {
    const newData = {
      id: (crypto as any).randomUUID(),
      country: ['Group 1'],
      customGroup: true,
      side: 'right',
      level: 0
    };
    return newData;
  }

  onCellEditingStopped(params) {
    this.showRowDataBefore();
    var rowsToBeUpdated = [];
    if (params.oldValue !== params.newValue) {
      params.data.country = [params.newValue];
      rowsToBeUpdated.push(params.data);
      const groupRowIndex = this.rightRowData.findIndex(a=> a.id === params.data.id);
      this.rightRowData.forEach(a=> {
        if(a.id !== params.data.id) {
          if(a.country[0] === params.oldValue) {
            a.country[0] = params.newValue;
            rowsToBeUpdated.push(a);
          }
        }
      });
      const res = this.rightApi.applyTransaction({ update: rowsToBeUpdated,
        addIndex: groupRowIndex
      });
      setTimeout(() => {
        this.showRowDataAfter();
      });
    }
  }

  onRowDragEnd(event) {
    try {
      this.showRowDataBefore();
      if (!event.node.data)
        return;
        
      if (!event.node.data.side) {
        const matchingRow = this.rightRowData.find(a=> a.id === event.node.data.id);
        matchingRow.side = 'right';
        const res = this.rightApi.applyTransaction({ update: [matchingRow] });
        return;
      }
      var movingNode = event.node;
      var overNode = event.overNode;
      var rowsToBeUpdated = [];

      var rowNeedsToMove = movingNode !== overNode;
      var movingData = movingNode.data;
      //If over row is not available and if current row level is 1 then it's a parent activity row and we have to remove custom group assigned to it.
      if (!overNode) {
        //If parent activity is inside a custom group then remove it.
        if (movingData.level === 1 && movingData.parentId && movingData.parentId != '') {
          this.addRemoveOrReplaceParentCustomGroup(movingData, null, rowsToBeUpdated, true);
          this.updateRowData(movingData, rowsToBeUpdated);
          return;
        }
      }
      else if (rowNeedsToMove && overNode) {
        // the list of rows we have is data, not row nodes, so extract the data
        var overData = overNode.data;

        if(!overNode.data)
          return;
        
        if(movingData.level !== overData.level && movingData.level !== overData.level + 1)
          return;
        
        if(movingData.customGroup && overData.customGroup) {
          // this.moveInArray(movingData, overData);
          return;
        }
        //If over row is not a custom group.
        else if(!overData.customGroup) {
          //If row levels are not same then don't move row.
          if(movingData.level !== overData.level)
            return;
          
          //If moving row is a parent activity row but its parent is not same as over row's parentId.
          if (movingData.level === 1 && movingData.parentId && movingData.parentId != '' && movingData.parentId !== overData.parentId) {
            //Then check if over row has parent or not.
            //If overData row has parent then move row into overData's parent custom group.
            if (overData.parentId && overData.parentId != '')
              this.addRemoveOrReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated, false);
            //Otherwise remove Moving row from its custom parent.
            else
              this.addRemoveOrReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated, true);

            this.updateRowData(movingData, rowsToBeUpdated);
            return;
          }
          //If moving row is not a parent activity row or its parentId is same as over row's parentId. Then change the rows position.
          else {
            // this.moveInArray(movingData, overData);
            return;
          }
        }
        //If over row is a custom group
        else if(overData.customGroup) {
          //If moving data is already inside overData custom group row.
          if(movingData.parentId === overData.id) {
            //Don't do anything.
            return;
          }
          //If moving data is not inside the overData custom group row
          else {
            //Check the current parent custom group row.
            //If moving parent activity row is inside one group then move it into another group.
            //if moving parent activity row is not part of any group then move it inside a custom group.
            this.addRemoveOrReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated, false);
            this.updateRowData(movingData, rowsToBeUpdated);
            return;
          }
        }
      }
    }
    finally {
      setTimeout((() => {
        this.backupRowDataAfter();
        this.showRowDataAfter();
      }).bind(this), 100);
    }
  }

  canRowDragLeftGrid(params) {
    return true;
  }

  moveRowOutsideCustomGroup(movingData, rowsToBeUpdated: any[]) {
    movingData.country.splice(0, 1);
    movingData.parentId = null;
    //Remove child activity rows from custom group
    const level2Rows = this.rightRowData.filter(a => a.parentId === movingData.id);
    if(level2Rows) {
      level2Rows.forEach(a => {
        a.country.splice(0, 1);
      });
      rowsToBeUpdated.push(...level2Rows);
    }
  }

  addReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated: any[], canReplace: Boolean) {
    const customGroupRow = this.rightRowData.find(a => a.country == overData.country[0] && a.customGroup);
    movingData.country.splice(0, canReplace, customGroupRow.country[0]);
    movingData.parentId = customGroupRow.id;
    //Move child rows inside the group.
    const level2Rows = this.rightRowData.filter(a => a.parentId === movingData.id);
    if(level2Rows) {
      level2Rows.forEach(a => a.country.splice(0, canReplace, customGroupRow.country[0]));
      rowsToBeUpdated.push(...level2Rows);
    }
  }

  addRemoveOrReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated: any[], canRemove: boolean) {
    if(canRemove) {
      this.moveRowOutsideCustomGroup(movingData, rowsToBeUpdated);
    }
    else {
      const movingDataHasParentCustomGroup = movingData.parentId && movingData.parentId != '';
      this.addReplaceParentCustomGroup(movingData, overData, rowsToBeUpdated, movingDataHasParentCustomGroup);
    }
  }

  moveInArray(movingData, overData) {
    this.showRowDataBefore();
    var fromIndex = this.rightRowData.findIndex(a=> a.id === movingData.id);
    var toIndex = this.rightRowData.findIndex(a=> a.id === overData.id);

    var newStore = this.rightRowData.slice();
    var element = newStore[fromIndex];
    newStore.splice(fromIndex, 1);
    newStore.splice(toIndex, 0, element);

    this.rightRowData = newStore;
    this.rightApi.setRowData(newStore);
  }

  updateRowData(movingData, rowsToBeUpdated: any[]) {
    rowsToBeUpdated.push(movingData);
    const res = this.rightApi.applyTransaction({ update: rowsToBeUpdated });
  }

  backupRowDataAfter() {
    this.rightRowData = [];
    this.rightApi.forEachNode(a => this.rightRowData.push(a.data));
  }

  showRowDataBefore() {
    console.error('before');
    this.rightApi.forEachNode(a=> console.log(a.data.country));
  }

  showRowDataAfter() {
    console.error('after');
    this.rightApi.forEachNode(a=> console.log(a.data.country));
  }

  hasCheckBox(params) {
    return true;
  }
}
