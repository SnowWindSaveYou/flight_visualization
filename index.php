<!DOCTYPE html>
<html>
    <head>
        <script src="https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js"></script>
        <!-- <script src="https://d3js.org/d3.v5.min.js"></script>
        <script type="text/javascript" src="test.js"></script> -->
        <style>
            li{
                list-style-type:none;
            }
            ul{
                list-style-type:none;
            }
            .links line {
                stroke: #999;
                stroke-opacity: 0.6;
            }
            
            .nodes circle {
                stroke: #123;
                stroke-width: 1.5px;
            }
            #aust_map{
                float:left;
                background:#AAA;
                width: 850px;
                height:700px;

            }
            #from_city_list{
                height:300px;
                margin-top:auto;
                padding:1px;
                overflow: auto;
            }
            #to_city_list{
                height:300px;
                margin-top:auto;
                padding:1px;
                overflow: auto;
            }
            .cblabel{
                width: 100%;
                display: inline-block;
            }
            .highlight{
                visibility:visible !important;
            }
        </style>
    </head>
    <body>
        <div style="width:1000px;height:700px;" >
        <!-- <div class="force-directed" width="960" height="600"> -->
        <div id="aust_map" ></div>
        <div style="float:left; width:150px;height:700px; background:#ccc;color:#fff;display: table">
            <div style="width:100%;display: table-row">
                <div> - From City<button  onclick="cancelFrom()">X</button></div>
                <ul id="from_city_list" > </ul>
            </div>
            <div style="width:100%;display: table-row">
                <div> - To City<button  onclick="cancelTo()">X</button></div>
                <ul id="to_city_list"> </ul>
            </div>
            <p style = "font-size:12px;padding:5px;display: table-row"> Jingyi Wu - 99151300</p>
        </div>
        <div>
            <ul id="flight_detail"></ul>
        </div>
        </div>


    </body>
    <footer>
            <script src="https://d3js.org/d3.v5.min.js"></script>
            <!-- <script type="text/javascript" src="test.js"></script> -->
            <script type="text/javascript" src="./flight_visual/flight_test.js"></script>
    </footer>
</html>