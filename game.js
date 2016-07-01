"use strict";

function timeDifference(date1,date2) {
        var difference = date1.getTime() - date2.getTime();

        var daysDifference = Math.floor(difference/1000/60/60/24);
        difference -= daysDifference*1000*60*60*24

       var hoursDifference = Math.floor(difference/1000/60/60);
        difference -= hoursDifference*1000*60*60

        var minutesDifference = Math.floor(difference/1000/60);
        difference -= minutesDifference*1000*60

        var secondsDifference = Math.floor(difference/1000);

     return [daysDifference , hoursDifference , minutesDifference, secondsDifference];
}

var _alert = function(txt,cb){
    var divObj=null;
    cb = cb||function(){};
    function getDOMElement(tagName,attb,style){
        if(divObj) return divObj;
        else{
            var tagName=tagName || 'div',attb=attb || {}, style=style || {};
            var elm=document.createElement(tagName);
            for(var i in attb) elm[i]=attb[i];
            for(var i in style) elm.style[i]=style[i];
            return document.body.appendChild(elm);
        }
    }
    //-оформление можешь сделать свое - если надо у меня есть готовое окно как в системе - неотличишь!
    var txtHTML='';
    txtHTML+='';
    txtHTML+=''+txt+'';
    txtHTML+='<button id="alert_OK">OK</button>';

    divObj=getDOMElement('div',{innerHTML:txtHTML},{display:'block',width:'400px',textAlign:'center',backgroundColor:'#000099',padding:'10px',border:'double 3px #FFFFFF',color:'#FFFFFF',position:'absolute',top:'50%',left:'50%',marginLeft:'-100px'});
    document.getElementById('alert_OK').onclick=function(evt){
        divObj.style.display='none'; 
        divObj.parentNode.removeChild(divObj);
        cb(evt);
    }
    document.getElementById('alert_OK').focus();
    document.getElementById('alert_OK').onblur=function(){
        document.getElementById('alert_OK').focus();
    };
};

var Gomoku = function(){
    var Size=20;
    var canvas;
    var game;
    var bot = 1;
    var c = 1; 
    var id=1;
    var count2win = 5;
    var server = 0;
    var startDate = undefined;
    var res = [];

    var f = new Array();
    var s = new Array();
    var q = new Array();
    
    var drawPos=0;
    var myTurn=0;
    var autoplayOn=0;
    var gameOver=0;
    var timerAP=0;
    var buf='';
    var hintShown=false;
    var iHint=6;
    var jHint=6;

    var machSq = -1;
    var userSq = 1;
    var iMax=new Array();
    var jMax=new Array();
    var nMax=0;

    var w = new Array(0,20,17,15.4,14,10);
    var nPos = new Array();
    var dirA = new Array(); 

    var winningMove=9999999;
    var openFour   =8888888;
    var twoThrees  =7777777;
    var cell = 20;

    function setSize(val){
        Size = parseInt(val);
        if(val == 3){
            count2win = 3;
        }else{
            count2win = 5;
        }
    }

    function initBoard(){

        startDate = undefined;
        canvas = document.getElementById("game");
        canvas.width = canvas.width;
        init();
        game = canvas.getContext("2d");
        
        for(var i=0;i<Size+1;i++){
            game.moveTo(cell*i, 0);
            game.lineTo(cell*i, cell*Size);
        }
        
        for(var i=0;i<Size+1;i++){
            game.moveTo(0, cell*i);
            game.lineTo(cell*Size, cell*i); 
        }
        
        game.strokeStyle="#000";
        game.stroke();
        canvas.addEventListener("click", canvasClick, false);
        c = 1; 	
    }

    function init(){

        drawPos=0;
        myTurn=0;
        autoplayOn=0;
        gameOver=0;
        timerAP=0;
        buf='';

        for (var i=0;i<Size;i++) {
            f[i]=new Array();
            s[i]=new Array();
            q[i]=new Array();
            for (var j=0;j<Size;j++) {
                f[i][j]=0;
                s[i][j]=0;
                q[i][j]=0;
            }
        }
    }s

    function getClickPosition(e){

        var x;
        var y;

        if (e.pageX != undefined && e.pageY != undefined) {

            x = e.pageX;
            y = e.pageY;

        }else {
            x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
        }

        x -= canvas.offsetLeft;
        y -= canvas.offsetTop;
        var xy=new Array(2);
        xy[0]=x;
        xy[1]=y;
        return xy;

    }

    function clickCellPosition(e){
        
        var xy = getClickPosition(e);
        var x_px = xy[0];
        var y_px = xy[1];
    
        var x=Math.floor(x_px/cell);
        var y=Math.floor(y_px/cell);
        
        var xy_px=Array(2);
        xy_px[0]=x;
        xy_px[1]=y;
        return xy_px;
        
    }

    function listenTurns(){
        
        $.getJSON("game.php?id="+id,function(data){

            $.each(data, function(id_msg, msg) {

                if(id<parseInt(msg[0], 10)+1){id = parseInt(msg[0], 10)+1;}

                    if(msg[3]=='1')drawCicle(parseInt(msg[1], 10),parseInt(msg[2], 10));
                    else drawCross(parseInt(msg[1], 10),parseInt(msg[2], 10));

            });
            setTimeout(listenTurns, 1000);
        });  
    }

    function drawCicle(x, y){
        
        game.strokeStyle = 'red';
        game.beginPath();      
        game.arc(cell/2+cell*x, cell/2+cell*y, cell*4/11, 0, Math.PI*2, true);            
        game.lineWidth = cell/5;
        game.stroke();
        
    }

    function drawCross(x, y, color){
        color = color||'green';
        game.strokeStyle = color;
        game.beginPath();
        
        game.moveTo(cell*x+4, cell*y+4);
        game.lineTo(cell*(x+1)-4, cell*(y+1)-4);
        
        game.moveTo(cell*(x+1)-4, cell*y+4);
        game.lineTo(cell*(x)+4, cell*(y+1)-4);
        
        game.lineWidth = cell/5;
        game.stroke();
    }


    function checkLine(x,y,c){
        
        var n=0;
        for(var i=x;i<Size && f[i][y]==c;i++){
            n++;
        }
        if(n>=count2win) return true; else n=0;
        for(var i=y;i<Size && f[x][i]==c;i++){
            n++;
        }
        if(n>=count2win) return true; else n=0;
        for(var i=y,j=x;i<Size && j<Size && f[j][i]==c;i++,j++){
            n++;
        }
        if(n>=count2win) return true; else n=0;
        for(var i=y,j=x;i<Size && j>-1 && f[j][i]==c;i++,j--){
            n++;
        }
        if(n>=count2win) return true;
        return false;
        
    }

    function checkWin(c){
        for(var i=0;i<Size;i++){
            for(var j=0;j<Size;j++){
                if(checkLine(i,j,c)) return true;
            }
        }
        return false;
    }

    function WinMessage(name){
        var difference =  timeDifference( new Date(), startDate);
        alert("You win о_О "+ name);
        gameOver = 1;
        if(c == 1){
            var result = prompt('Name', name);
            if(result){
                res.push({'name':result,'time':difference});
                alert('Name:'+result +' Time: '+difference.join(':'));
            } 
        }
    }
    
    function requestGameLogic(param){
        $.post("game.php", param, function(data){

            var position = data['position'];

            var _player =  c == 1 ? 'Cross' : 'Cicle';
            window['draw'+_player](parseInt(position[0], 10),parseInt(position[1], 10));

            if(data.winner){
                WinMessage(_player);
                return;
            }
            c = c == 1 ? 2 : 1;
        });
    }

    function canvasClick(e){

        var xy=clickCellPosition(e);
        var x=xy[0];
        var y=xy[1];
        if(x>=0 && x<Size && y>=0 && y<Size && !f[x][y]){
            if(server){
                f[x][y]= c ;
                var param = { "p":c, "x":x, "y":y, "f":JSON.stringify(f) };
                requestGameLogic(param)

            }else{
                if(!gameOver){
                    if(c==1){
                        drawCross(x, y);
                        f[x][y]=1;
                        if(bot){
                            machineMove(x, y);
                        }                   
                    }else{
                        drawCicle(x, y);
                        f[x][y]=-1;
                    }

                    if (drawPos) {gameOver = 1;alert("It\'s a draw!");return}
                    if(checkWin(c?1:-1)){
                        var win = c?'Cross':'Cicle';
                        WinMessage(win);
                        return;
                    }
                    c = (c == 1) ? 0 : 1;
                }else{
                    alert("GameOver");return
                }
            }
            if(!startDate) startDate = new Date();
        /**/
        }
        
    }
    /*********************/


    function showHint () {
        if (myTurn && autoplayOn) return;
        //if (hintShown) {hideHint();return;}
        hintShown=1;
        getBestUserMove();
        drawCross(iHint,jHint,'gray');
    };

    function hideHint() {
        //hintShown=0;
        //drawCross(iHint,jHint,'gray');
    };

    function autoplay() {
        if (autoplayOn) {
            if (myTurn) {
                var p = getBestMachMove();
                var iMach = p[0];
                var jMach = p[1];
                f[iMach][jMach]=machSq;
                drawCross(iMach,jMach);
                //timerDR=setTimeout("drawCross(iMach,jMach,machSq);",900);
                if (checkWin(machSq)) {gameOver=1;alert("Player X won!");}
                else if (drawPos) {alert("It\'s a draw!");}
                else { myTurn=false; timerAP=setTimeout(function(){autoplay();},950); }
            } else {
                getBestUserMove();
                f[iHint][jHint]=userSq;
                drawCicle(iHint,jHint);
                //timerDR=setTimeout("drawCicle(iHint,jHint,userSq)",900);
                if (checkWin(userSq)) {gameOver=1;alert("Player O won!");}
                else { myTurn=true; timerAP=setTimeout(function(){autoplay();},950); }
            }
        }
    };

    function setAutoplay() {
        if (gameOver) initBoard();
        if (autoplayOn) {
            if (myTurn) { setAutoplay(); return; }
            autoplayOn=0;
            clearTimeout(timerAP);
            return;
        }
        if (document.images) setTimeout(function(){hideHint();autoplayOn=1;autoplay();},100);
        else alert('Sorry, Autoplay Mode is not supported for your browser!');
    }


    function hasNeighbors(i,j) {
        if (j>0 && f[i][j-1]!=0) return 1;
        if (j+1<Size && f[i][j+1]!=0) return 1; 
        if (i>0) {
            if (f[i-1][j]!=0) return 1;
            if (j>0 && f[i-1][j-1]!=0) return 1;
            if (j+1<Size && f[i-1][j+1]!=0) return 1;
        }
        if (i+1<Size) {
            if (f[i+1][j]!=0) return 1;
            if (j>0 && f[i+1][j-1]!=0) return 1;
            if (j+1<Size && f[i+1][j+1]!=0) return 1;
        }
        return 0;
    }



    function winningPos(i,j,mySq) {
        var test3=0;
        var test4=0;
        var limit = count2win;
        var L=1,m,m1,m2,side1,side2;
        m=1; while (j+m<Size  && f[i][j+m]==mySq) {L++; m++} m1=m;
        m=1; while (j-m>=0 && f[i][j-m]==mySq) {L++; m++} m2=m;   
        if (L>(limit-1)) { return winningMove; }
        side1=(j+m1<Size && f[i][j+m1]==0);
        side2=(j-m2>=0 && f[i][j-m2]==0);

        if (L==(limit-1) && (side1 || side2)) test3++;
        if (side1 && side2) {
            if (L==(limit-1)) test4=1;
            if (L==(limit-2)) test3++;
        }

        L=1;
        m=1; while (i+m<Size  && f[i+m][j]==mySq) {L++; m++} m1=m;
        m=1; while (i-m>=0 && f[i-m][j]==mySq) {L++; m++} m2=m;   
        if (L>(limit-1)) { return winningMove; }
        side1=(i+m1<Size && f[i+m1][j]==0);
        side2=(i-m2>=0 && f[i-m2][j]==0);
        if (L==(limit-1) && (side1 || side2)) test3++;
        if (side1 && side2) {
            if (L==(limit-1)) test4=1;
            if (L==(limit-2)) test3++;
        }

        L=1;
        m=1; while (i+m<Size && j+m<Size && f[i+m][j+m]==mySq) {L++; m++} m1=m;
        m=1; while (i-m>=0 && j-m>=0 && f[i-m][j-m]==mySq) {L++; m++} m2=m;   
        if (L>(limit-1)) { return winningMove; }
        side1=(i+m1<Size && j+m1<Size && f[i+m1][j+m1]==0);
        side2=(i-m2>=0 && j-m2>=0 && f[i-m2][j-m2]==0);
        if (L==(limit-1) && (side1 || side2)) test3++;
        if (side1 && side2) {
            if (L==(limit-1)) test4=1;
            if (L==(limit-2)) test3++;
        }

        L=1;
        m=1; while (i+m<Size  && j-m>=0 && f[i+m][j-m]==mySq) {L++; m++} m1=m;
        m=1; while (i-m>=0 && j+m<Size && f[i-m][j+m]==mySq) {L++; m++} m2=m; 
        if (L>(limit-1)) { return winningMove; }
        side1=(i+m1<Size && j-m1>=0 && f[i+m1][j-m1]==0);
        side2=(i-m2>=0 && j+m2<Size && f[i-m2][j+m2]==0);
        if (L==(limit-1) && (side1 || side2)) test3++;
        if (side1 && side2) {
            if (L==(limit-1)) test4=1;
            if (L==(limit-2)) test3++;
        }

        if (test4) return openFour;
        if (test3>=2) return twoThrees;
        return -1;
    }

    function evaluatePos(a,mySq) {
        var maxA=-1;
        drawPos=true;
        var limit = count2win;
        var minM,minN,maxM,maxN,A1,A2,A3,A4,m;
        for (var i=0;i<Size;i++) {
            for (var j=0;j<Size;j++) {

                // Compute "value" a[i][j] of the (i,j) move

                if (f[i][j]!=0) {a[i][j]=-1; continue;}  
                if (hasNeighbors(i,j)==0) {a[i][j]=-1; continue;}

                var wp = winningPos(i,j,mySq);
                if (wp>0) a[i][j]=wp;
                else {
                    minM=i-(limit-1); if (minM<0) minM=0;
                    minN=j-(limit-1); if (minN<0) minN=0;
                    maxM=i+limit; if (maxM>Size) maxM=Size;
                    maxN=j+limit; if (maxN>Size) maxN=Size;

                    nPos[1]=1; A1=0;
                    m=1; while (j+m<maxN  && f[i][j+m]!=-mySq) {nPos[1]++; A1+=w[m]*f[i][j+m]; m++}
                    if (j+m>=Size || f[i][j+m]==-mySq) A1-=(f[i][j+m-1]==mySq)?(w[limit]*mySq):0;
                    m=1; while (j-m>=minN && f[i][j-m]!=-mySq) {nPos[1]++; A1+=w[m]*f[i][j-m]; m++}   
                    if (j-m<0 || f[i][j-m]==-mySq) A1-=(f[i][j-m+1]==mySq)?(w[limit]*mySq):0;
                    if (nPos[1]>(limit-1)) drawPos=false;

                    nPos[2]=1; A2=0;
                    m=1; while (i+m<maxM  && f[i+m][j]!=-mySq) {nPos[2]++; A2+=w[m]*f[i+m][j]; m++}
                    if (i+m>=Size || f[i+m][j]==-mySq) A2-=(f[i+m-1][j]==mySq)?(w[limit]*mySq):0;
                    m=1; while (i-m>=minM && f[i-m][j]!=-mySq) {nPos[2]++; A2+=w[m]*f[i-m][j]; m++}   
                    if (i-m<0 || f[i-m][j]==-mySq) A2-=(f[i-m+1][j]==mySq)?(w[limit]*mySq):0; 
                    if (nPos[2]>(limit-1)) drawPos=false;

                    nPos[3]=1; A3=0;
                    m=1; while (i+m<maxM  && j+m<maxN  && f[i+m][j+m]!=-mySq) {nPos[3]++; A3+=w[m]*f[i+m][j+m]; m++}
                    if (i+m>=Size || j+m>=Size || f[i+m][j+m]==-mySq) A3-=(f[i+m-1][j+m-1]==mySq)?(w[limit]*mySq):0;
                    m=1; while (i-m>=minM && j-m>=minN && f[i-m][j-m]!=-mySq) {nPos[3]++; A3+=w[m]*f[i-m][j-m]; m++}   
                    if (i-m<0 || j-m<0 || f[i-m][j-m]==-mySq) A3-=(f[i-m+1][j-m+1]==mySq)?(w[limit]*mySq):0; 
                    if (nPos[3]>(limit-1)) drawPos=false;

                    nPos[4]=1; A4=0;
                    m=1; while (i+m<maxM  && j-m>=minN && f[i+m][j-m]!=-mySq) {nPos[4]++; A4+=w[m]*f[i+m][j-m]; m++;}
                    if (i+m>=Size || j-m<0 || f[i+m][j-m]==-mySq) A4-=(f[i+m-1][j-m+1]==mySq)?(w[limit]*mySq):0;
                    m=1; while (i-m>=minM && j+m<maxN  && f[i-m][j+m]!=-mySq) {nPos[4]++; A4+=w[m]*f[i-m][j+m]; m++;} 
                    if (i-m<0 || j+m>=Size || f[i-m][j+m]==-mySq) A4-=(f[i-m+1][j+m-1]==mySq)?(w[limit]*mySq):0;
                    if (nPos[4]>(limit-1)) drawPos=false;

                    dirA[1] = (nPos[1]>(limit-1)) ? A1*A1 : 0;
                    dirA[2] = (nPos[2]>(limit-1)) ? A2*A2 : 0;
                    dirA[3] = (nPos[3]>(limit-1)) ? A3*A3 : 0;
                    dirA[4] = (nPos[4]>(limit-1)) ? A4*A4 : 0;

                    A1=0; A2=0;
                    for (var k=1;k<limit;k++) {
                        if (dirA[k]>=A1) {A2=A1; A1=dirA[k]}
                    }
                    a[i][j]=A1+A2;
                }
                if (a[i][j]>maxA) {
                    maxA=a[i][j];
                }
            }
        }
        return maxA;
    }

    function getBestMachMove() {
        var maxS=evaluatePos(s,userSq);
        var maxQ=evaluatePos(q,machSq);

        if (maxQ>=maxS) {
            maxS=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (q[i][j]==maxQ) {
                        if (s[i][j]>maxS) {maxS=s[i][j]; nMax=0}
                        if (s[i][j]==maxS) {iMax[nMax]=i;jMax[nMax]=j;nMax++} 
                    }
                }
            }
        }
        else {
            maxQ=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (s[i][j]==maxS) {
                        if (q[i][j]>maxQ) {maxQ=q[i][j]; nMax=0}
                        if (q[i][j]==maxQ) {iMax[nMax]=i;jMax[nMax]=j;nMax++} 
                    }
                }
            }
        }
        // alert('nMax='+nMax+'\niMax: '+iMax+'\njMax: '+jMax)

        var randomK=Math.floor(nMax*Math.random());
        var iMach=iMax[randomK];
        var jMach=jMax[randomK];
        return [iMach,jMach];
    }

    function getBestUserMove() {
        var maxQ=evaluatePos(q,-1);
        var maxS=evaluatePos(s,1);

        if (maxS==-1) {
            var center=Math.floor(Size/2);
            s[center][center]=1
            maxS=1; 
        }

        if (maxS>=maxQ) {
            maxQ=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (s[i][j]==maxS) {
                        if (q[i][j]>maxQ) {maxQ=q[i][j]; nMax=0}
                        if (q[i][j]==maxQ) {iMax[nMax]=i;jMax[nMax]=j;nMax++} 
                    }
                }
            }
        } else {
            maxS=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (q[i][j]==maxQ) {
                        if (s[i][j]>maxS) {maxS=s[i][j]; nMax=0}
                        if (s[i][j]==maxS) {iMax[nMax]=i;jMax[nMax]=j;nMax++} 
                    }
                }
            }
        }

        // alert('nMax='+nMax+'\niMax: '+iMax+'\njMax: '+jMax)

        var randomK=Math.floor(nMax*Math.random());
        iHint=iMax[randomK];
        jHint=jMax[randomK];
    }

    function Move(){
        var maxS=evaluatePos(s,1);
        var maxQ=evaluatePos(q,-1);

        if (maxQ>=maxS) {
            maxS=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (q[i][j]==maxQ && s[i][j]>maxS) {
                        maxS=s[i][j]; 
                        var iMach=i;
                        var jMach=j;
                    }
                }
            }
        } else {
        maxQ=-1;
            for (var i=0;i<Size;i++) {
                for (var j=0;j<Size;j++) {
                    if (s[i][j]==maxS && q[i][j]>maxQ) {
                        maxQ=q[i][j]; 
                        var iMach=i;
                        var jMach=j;
                    }
                }
            }
        }
        return [iMach,jMach];
        
    };

    function machineMove(iUser, jUser) {

        var position = Move();
        f[position[0]][position[1]]=machSq;
        drawCicle(position[0], position[1]);
        if(checkWin(c?1:-1)){
            var win = c?'Cross':'Cicle';
            WinMessage(win);
        }
        c = c == 1 ? 0 : 1;

    }

    return {
        initBoard : initBoard,
 		setAutoplay : setAutoplay,
        showHint : showHint,
        result : res,
        setSize : setSize,
    }
}();

