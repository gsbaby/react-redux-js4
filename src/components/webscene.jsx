import React from 'react';
import PropTypes from 'prop-types';

import SceneView from 'esri/views/SceneView';
import WebScene from 'esri/WebScene';
import UniqueValueRenderer from 'esri/renderers/UniqueValueRenderer';
import SimpleRenderer from 'esri/renderers/SimpleRenderer';
import MeshSymbol3D from 'esri/symbols/MeshSymbol3D';
import FillSymbol3DLayer from 'esri/symbols/FillSymbol3DLayer';
import Query from 'esri/tasks/support/Query';

import { loadWebScene } from '../reducers/webscene/actions';
import { viewChange } from '../reducers/view/actions'
import { selectionChange, selectionAdd, selectionRemove, selectionReset } from '../reducers/selection/actions';


const hasItem = (array, OID) => {
  for (let i=0; i<array.length; i++) {
    if (array[i].OID === OID) return true;
  }
  return false;
};

class WebSceneView extends React.Component {
    static propTypes = {
        websceneid: PropTypes.string.isRequired,
        store: PropTypes.object.isRequired
    };

    componentDidMount() {
        var webscene = new WebScene({
            portalItem: { id: this.props.websceneid }
        });

        var view = new SceneView({
            container: this.refs.sceneView,
            map: webscene
        });

        webscene.then(() => {
            var sceneLayer = webscene.layers.getItemAt(0);
            sceneLayer.popupEnabled = false;

            view.whenLayerView(sceneLayer)
                .then((sceneLayerView) => {
                    window._debug = { webscene, view, sceneLayer, sceneLayerView };
                    this.attachMouseFunctions(webscene, view, sceneLayer, sceneLayerView);
                });

            view.watch('interacting, scale, zoom', () => {
                this.props.store.dispatch(viewChange(view));
            });

            this.props.store.dispatch(setScene(websceneid, webscene, view));
        });
    }

    componentWillUnMount() {
        //...
    }

    attachMouseFunctions(webscene, view, sceneLayer, sceneLayerView) {
        view.on('click', event => {
            // reset current selection
            var { selection } = this.props.store.getState();
            
            if (!(event.native.shiftKey || event.native.ctrlKey || event.native.metaKey)) {
              for (let i=0; i<selection.items.length; i++) {
                selection.items[i].highlight.remove();
              }
              this.props.store.dispatch(selectionReset());
            }

            view.hitTest(event.screenPoint)
              .then(response => {
                if (response.results[0].graphic) {
                  var graphic = response.results[0].graphic;
                  console.log(graphic.attributes.OID);

                  var query = new Query({
                    objectIds: [graphic.attributes.OID + 1],
                    outFields: ["*"]
                  });

                  sceneLayer.queryFeatures(query)
                    .then(result => {
                      console.log(result.features[0].attributes);
                      var { selection } = this.props.store.getState();
                      if (hasItem(selection.items, graphic.attributes.OID)) {
                        this.props.store.dispatch(selectionRemove(graphic.attributes.OID));
                      } else {
                        this.props.store.dispatch(selectionAdd(graphic.attributes.OID, result.features[0].attributes, sceneLayerView.highlight(graphic)));
                      }
                      var state = this.props.store.getState();
                    })
                    .otherwise(err => {
                      console.log(err);
                    })
                }
              });
          })
    }
  
    render() {
        return (
            <div className="sceneView" ref="sceneView"></div>
        );
    }
}

export default WebSceneView;


/*sceneLayerView.watch('updating', () => {
            if (!sceneLayerView.updating) {
              var query = new Query({
                outFields: ["scenario"]
              });

              sceneLayerView.queryFeatures(query)
                .then(result => {
                  //console.log(result);
                });
            }
          });*/


/*var testRenderer = new UniqueValueRenderer({
        field: "scenario",
        defaultSymbol: new MeshSymbol3D({
          symbolLayers: [
            new FillSymbol3DLayer({
              material: {
                color: null,
                colorMixMode: null
              }
            })
          ]
        }),
        uniqueValueInfos: [{
          value: 2,
          symbol: new MeshSymbol3D({
            symbolLayers: [
              new FillSymbol3DLayer({
                material: {
                  color: '#C0DEFA',
                  colorMixMode: 'tint'
                }
              })
            ]
          })
        },
        {
          value: 4,
          symbol: new MeshSymbol3D({
            symbolLayers: [
              new FillSymbol3DLayer({
                material: {
                  color: '#C3E4AD',
                  colorMixMode: 'tint'
                }
              })
            ]
          })
        },
        {
          value: 6,
          symbol: new MeshSymbol3D({
            symbolLayers: [
              new FillSymbol3DLayer({
                material: {
                  color: '#C2E2D4',
                  colorMixMode: 'tint'
                }
              })
            ]
          })
        }]
      });
      sceneLayer.renderer = testRenderer;*/