
require( [
    'esri/Map',
    'esri/layers/ElevationLayer',
    'esri/views/SceneView',
    'esri/layers/SceneLayer',
    'esri/layers/GroupLayer',
    'esri/rest/support/Query',
    'esri/views/layers/support/FeatureFilter',
    'esri/Graphic',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/layers/MapImageLayer',
    'esri/geometry/Multipoint',
    "esri/core/watchUtils",

], function ( Map,
    ElevationLayer,
    SceneView,
    SceneLayer,
    GroupLayer,
    Query,
    FeatureFilter,
    Graphic,
    GraphicsLayer,
    FeatureLayer,
    MapImageLayer,
    Multipoint,
    watchUtils ) {

    let _map;
    let _view;
    let _graphicsLayer = new GraphicsLayer();
    let _center;

    setMap();
    setView();

    function setMap() {
        _map = new Map( {
            basemap: 'gray',
            ground: 'world-elevation'
        } );
        const elevationLayer = new ElevationLayer( {
            url: 'https://dssmappor.ncdr.nat.gov.tw/server/rest/services/NCDR_Basemap/MOI_W84_TPKMDEM_2018/ImageServer'
        } );
        _map.ground.layers.add( elevationLayer );

    }

    function setView() {
        _view = new SceneView( {
            map: _map,
            container: viewDiv,
            center: [121.480087, 25.016869],
            zoom: 16,
            qualityProfile: 'low',
            navigation: {
                gamepad: {
                    enabled: false
                },
                browserTouchPanEnabled: false,
                momentumEnabled: false,
            }
        } );
    }

    const buildingsLayer = new FeatureLayer( {
        url: "https://richimap2.richitech.com.tw/arcgis/rest/services/test/NCDR_SDE_Building_NTP/MapServer/0",
    } );

    _map.add( _graphicsLayer );

    function renderBuilding() {
        _center = getCenter();
        buildingsLayer.queryFeatures( new Query( {
            outFields: ["z", "classify", "OBJECTID", "BUILD_ID"],
            geometry: {
                type: "point",
                x: _center[0],
                y: _center[1],
            },
            spatialRelationship: "contains",
            distance: 1000,
            units: "meters",
            returnGeometry: true
        } ) ).then( results => {
            results.features.forEach( ( item, index ) => {
                item.symbol = getSymbol( item.attributes.classify, item.attributes.z );
                _graphicsLayer.add( item );
            } );
        } );
    }

    function getCenter() {
        return [_view.center.longitude, _view.center.latitude];
    }

    function getSymbol( classify, z ) {
        const colorTable = {
            0: '#AAAAAA',
            1: '#DD0000',
            2: '#00DD00',
        };
        return {
            type: "polygon-3d",
            symbolLayers: [
                {
                    type: "extrude",
                    material: {
                        color: colorTable[classify]
                    },
                    size: z
                }
            ]
        };
    }

    watchUtils.whenTrue( _view, 'stationary', () => {
        console.log( 'View stop!!!' );
        renderBuilding();
    } );

    watchUtils.whenFalse( _view, 'stationary', () => {
        console.log( 'View move!!!' );
        _graphicsLayer.removeAll();
    } );

    // _view.whenLayerView( buildingsLayer ).then( function ( layerView ) {
    //     _buildingLayerView = layerView;
    //     console.log( 'done' );

    //     watchUtils.whenTrue( _view, 'stationary', () => {
    //         console.log( 'View stop!!!' );
    //         _center = getCenter();

    //         _buildingLayerView.filter = new FeatureFilter( {
    //             geometry: {
    //                 type: "point",
    //                 x: _center[0],
    //                 y: _center[1],
    //             },
    //             spatialRelationship: "intersects",
    //             distance: 1000,
    //             units: "meters"
    //         } );
    //     } );
    // } );

} );