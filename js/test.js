window.onload = function(){
	// Vue
	var music = new Vue({
		el: '.music',
		data: {
			// 搜索框输入的信息
			search_music: "",
			// 音乐专辑封面
			cover_url: "",
			// 音乐id
			music_id: 0,
			// 音乐列表对象
			music_list: [],
			// 当前播放的音乐名称
			music_name: "",
			// 歌手
			music_singer: "",
			// 专辑
			music_album: "",
			// 当前播放的mv音乐名称
			mv_name: "",
			// mv_歌手
			mv_singer: "",
			// mv_专辑
			mv_album: "",
			// 歌曲歌词
			music_lyric: [],
			// 音乐mv列表
			music_mv: [],
			// 该歌曲是否有MV
			mv_flag: false,
			// 全选
			checkAll: true,
			// 播放进度计时器
			music_interval: 0,
			// 记录音量单击禁音前的控制点和进度条的位置
			volume_btn: "",
			volume_w: "",
			// 拖动音乐进度条时暂停music_content函数内的移动
			progressBarMove: true,
			// 歌词累加器
			LyricCount: 0,
			// 歌词滚动值
			LyricTop: -50,
			// 歌词C位
			LyricLight: 3,
			// 歌词滚动计时器
			Lyric_interval: 0,
			// 搜索错误信息
			err: ""
		},
		methods: {
			// 获取传入标签距离body的上或左偏移值
			offset: function(curEle){
				var totalLeft = null,totalTop = null,par = curEle.offsetParent;
				//首先加自己本身的左偏移和上偏移
				totalLeft+=curEle.offsetLeft;
				totalTop+=curEle.offsetTop
				//只要没有找到body，我们就把父级参照物的边框和偏移也进行累加
				while(par){
					if(navigator.userAgent.indexOf("MSIE 8.0")===-1){
					//累加父级参照物的边框
					totalLeft+=par.clientLeft;
					totalTop+=par.clientTop
					}
					//累加父级参照物本身的偏移
					totalLeft+=par.offsetLeft;
					totalTop+=par.offsetTop
					par = par.offsetParent;
				}
				return{
					left:totalLeft,
					top:totalTop
			  }
			},
			// 音乐进度条拖拽控制
			music_progressMove: function(){
				// 拖动进度条时暂停music_content函数内的进度条移动
				this.progressBarMove = false;
				var audio = document.querySelector("#music");
				var time = audio.duration;
				// 获取歌曲滚动进度条
				var music_progressBar = document.querySelector(".progress_bar");
				// 获取进度条距离页面左侧偏移值
				var music_progress = document.querySelector(".progress");
				var progressX = this.offset(music_progress).left;
				// 获取歌曲进度条控制点
				var music_bar = document.querySelector(".bar");
				var that = this;
				document.onmousemove = function(){
					// 根据鼠标移动 获取距离容器左侧之后的位置
					var afterX = event.pageX;
					var progress = afterX - progressX;
					// 限制进度条拖动
					if(progress <= 500 && progress >=0){
						music_progressBar.style.width = progress + "px";
						music_bar.style.left = progress + 40 + "px";
					}
					document.onmouseup = function(){
						try{
							// 鼠标松开定位到当前位置
							audio.currentTime = progress / 500 * time;
							// 鼠标松开 歌词跟随定位
							var currentTime = Math.ceil(audio.currentTime);
							var p = document.querySelectorAll("#lyric p");
							var lyric = that.music_lyric;
							for(var i=0;i<lyric.length;i++){
								if(lyric[i].time <= currentTime){}else{
									that.lyricLight(p);
									that.LyricCount = i;
									p[i].className = "active";
									break;
								}
							}
						}catch(e){
							//TODO handle the exception
							console.log("还未选择播放的音乐哦!");
						}
						// 恢复music_content的进度条移动
						that.progressBarMove = true;
						// 鼠标弹起停止
						document.onmousemove = false;
						document.onmouseup = false;
					}
				}
			},
			// 音乐进度条单击改变位置与时长
			music_progressBar: function(){
				var audio = document.querySelector("#music");
				// 获取歌曲滚动进度条
				var music_progressBar = document.querySelector(".progress_bar");
				// 获取歌曲进度条控制点
				var music_bar = document.querySelector(".bar");
				// 获取鼠标距离容器左侧位置
				var mouse_X = event.offsetX;
				// 鼠标点击进度条 移动其位置
				music_progressBar.style.width = mouse_X + "px";
				music_bar.style.left = (mouse_X + 37.5) + "px";
				
				try{
					// 获取当前音乐总秒数
					var time = audio.duration;
					// 鼠标距离容器左侧偏移值 / 音乐进度条容器宽度 * 当前音乐总秒数
					audio.currentTime = mouse_X / 500 * time;
					
					// 歌词跟随定位
					var currentTime = Math.ceil(audio.currentTime);
					var p = document.querySelectorAll("#lyric p");
					var lyric = this.music_lyric;
					for(var i=0;i<lyric.length;i++){
						if(lyric[i].time <= currentTime){}else{
							this.lyricLight(p);
							this.LyricCount = i;
							p[i].className = "active";
							break;
						}
					}
				}catch(e){
					//TODO handle the exception
					console.log("当前还未选择音乐哦!");
				}
			},
			// 音量进度条拖动控制
			music_volumeMove: function(){
				var audio = document.querySelector("#music");
				// 音量图标
				var volume_icon = document.querySelector("#volume_icon");
				// 音量原点
				var volume_bar = document.querySelector(".volume_bar");
				// 音量进度白条
				var volume_progress_bar = document.querySelector(".volume_progress_bar");
				// 获取音量容器宽度
				var volume = window.getComputedStyle(volume_progress_bar).width;
				var mouse_BeforeX = event.pageX;
				document.onmousemove = function(){
					// 获取鼠标距离页面左边距离
					var mouse_AfterX = event.pageX;
					// 将单击时鼠标距离页面左侧距离减去实时移动的距离再减去音量容器的宽度
					var progress = mouse_AfterX - mouse_BeforeX + parseInt(volume);
					// 规定拖拽范围
					if(progress >= 0 && progress <= 100){
						volume_bar.style.left = (progress + 40) + "px";
						volume_progress_bar.style.width = progress + "px";
						audio.volume = progress / 100;
						// 根据音量改变音量图标
						if(progress < 50){
							volume_icon.className = "fa fa-volume-down";
						}else if(progress >= 50){
							volume_icon.className = "fa fa-volume-up";
						}
						if(progress === 0){
							volume_icon.className = "fa fa-volume-off";
						}
					}
					document.onmouseup = function(){
						// 鼠标松开清除移动事件
						document.onmousemove = false;
					}
				}
			},
			// 音量图标单击静音 再次单击恢复
			music_volumeBtn: function(event){
				var audio = document.querySelector("#music");
				var that = event.target;
				var volume_bar = document.querySelector(".volume_bar");
				var volume_progress_bar = document.querySelector(".volume_progress_bar");
				if("fa fa-volume-up" === that.className || "fa fa-volume-down" === that.className){
					// 事先存好禁音前的音量
					this.volume_btn = window.getComputedStyle(volume_bar).left;
					this.volume_w = window.getComputedStyle(volume_progress_bar).width;
					that.className = "fa fa-volume-off";
					volume_bar.style.left = "40px";
					volume_progress_bar.style.width = "0px";
					audio.volume = 0;
				}else{
					// 根据音量改变音量图标
					if(parseInt(this.volume_w) < 50){
						that.className = "fa fa-volume-down";
					}else{
						that.className = "fa fa-volume-up";
					}
					volume_bar.style.left = this.volume_btn;
					volume_progress_bar.style.width = this.volume_w;
					audio.volume = parseInt(this.volume_w) / 100;
				}
			},
			// 音量进度条点击
			music_volume: function(){
				var audio = document.querySelector("#music");
				// 获取鼠标距离页面左边距离
				var mouse_X = event.offsetX;
				// 音量进度条按钮
				var volume_bar = document.querySelector(".volume_bar");
				volume_bar.style.left = (mouse_X + 40) + "px";
				// 音量进度条单击 移动到鼠标位置
				var volume_progress_bar = document.querySelector(".volume_progress_bar");
				volume_progress_bar.style.width = mouse_X + "px";
				// 根据进度条更改音量
				audio.volume = parseInt(volume_progress_bar.style.width) / 100;
				// 音量图标跟随音量变换
				var volume_icon = document.querySelector("#volume_icon");
				if(audio.volume * 100 < 50){
					volume_icon.className = "fa fa-volume-down";
				}else if(audio.volume * 100 >= 50){
					volume_icon.className = "fa fa-volume-up";
				}else{
					volume_icon.className = "fa fa-volume-off";
				}
			},
			// 音乐播放实时显示时间
			music_content: function(){
				// 获取音乐的总时长和当前播放时间(单位:秒)
				var audio = document.querySelector("#music");
				var time = audio.duration;
				var currentTime = audio.currentTime;
				// 当前音乐播放时间
				var music_now = this.change_duration(currentTime);
				// 当前音乐总时长
				var duration = this.change_duration(time);
				// 当前播放时间
				var music_time = document.querySelector(".music_time");
				// 进度条和进度条原点跟随音乐时间走动
				var bar = document.querySelector(".bar");
				var progress_bar = document.querySelector(".progress_bar");
				// 歌曲时间显示
				music_time.innerText = music_now + "/" + duration;
				// 拖动音乐进度条时进度条停止移动，否则会冲突
				if(this.progressBarMove){
					progress_bar.style.width = (currentTime/time*500) + "px";
					bar.style.left = (currentTime/time*500 + 40) + "px";
				}
				var that = this;
				// 底部播放按钮
				var play_icon = document.querySelector("#play");
				// 音乐时间结束则停止 恢复原来模样
				audio.onended = function(){
					play_icon.className = "fa fa-play";
					var menuAll = document.querySelectorAll("#music_menu");
					// 播放菜单按钮恢复
					for(var i=0;i<menuAll.length;i++){
						menuAll[i].className = '';
					}
					// 进度条归位 歌词清空
					progress_bar.style.width = "0px";
					bar.style.left = 40 + "px";
					music_time.innerText = "";
					that.LyricCount = 0;
					// 进度条时间停止
					clearInterval(that.music_interval);
					// 歌词回滚顶部
					var p = document.querySelectorAll("#lyric p");
					var lyricBody = document.querySelector("#lyric");
					lyricBody.style.transform = "translateY(0)";
					that.LyricCount = 0;
					that.lyricLight(p);
					clearInterval(that.Lyric_interval);
					// 顺序播放
					that.next();
				}
				
				// 歌曲Mv
				var video = document.querySelector("#Mv");
				// MV介入 歌曲暂停播放
				video.onplay = function(){
					audio.pause();
					clearInterval(that.music_interval);
					clearInterval(that.Lyric_interval);
					play_icon.className = 'fa fa-play';
				}
				// MV关闭 歌曲继续播放
				video.onpause = function(){
					audio.play();
					// 进度条实时移动,音乐时间实时改变
					that.music_interval = setInterval(that.music_content,1000);
					that.Lyric_interval = setInterval(that.lyricRoll,100);
					play_icon.className = 'fa fa-pause';
				}
			},
			// 音乐搜索
			music_search: function(){
				var that = this;
				// 弹出提示
				var message = document.querySelector("#message");
				message.innerText = '搜索中';
				message.style.top = "10px";
				if(that.search_music != ""){
					axios.get("https://music.cyrilstudio.top/search?keywords="+that.search_music)
					.then(function(response){
						that.music_list = response.data.result.songs;
						message.innerText = '搜索完成';
						message.style.top = "-40px";
						// 回到顶部
						var music_content = document.querySelector("#music_content");
						music_content.scrollTop = 0;
						// 恢复播放按钮的显示
						var playBtnAll = document.querySelectorAll("#menu .play");
						for(var i=0;i<playBtnAll.length;i++){
							playBtnAll[i].classList.remove("active");
						}
						that.err = "歌曲来源于网易云音乐";
						setTimeout(function(){that.err = ""},2000);
					}).catch(function(err){
						that.err = "搜索失败,请稍后再试";
						setTimeout(function(){that.err = ""},3000);
						console.log(err);
					});
				}
			},
			// 单击歌手搜索其歌曲
			singerMusic: function(singer){
				this.search_music = singer;
				this.music_search();
			},
			// 获取音乐专辑封面
			get_cover: function(id){
				var that = this;
				axios.get("https://music.cyrilstudio.top/artist/album?id="+id)
				.then(function(response){
					that.cover_url = response.data.artist.picUrl;
					// 主体背景替换为专辑封面
					// var bodyBG1 = document.querySelector("#vagueBox");
					var bodyBG2 = document.querySelector(".music");
					// bodyBG1.style.backgroundImage = "url("+that.cover_url+")";
					bodyBG2.style.backgroundImage = "url("+that.cover_url+")";
				}).catch(function(err){
					console.log(err);
				})
			},
			// 根据当前播放的歌曲显示播放时间
			change_duration: function(time){
				var minute = parseInt(time / 60); // 分钟
				var second = Math.round(time % 60); // 秒钟
				if(second == 60){
					second = 0;
					minute+=1;
				}
				if(minute < 10){
					minute = "0" + minute;
				}
				if(second < 10){
					second = "0" + second;
				}
				return minute + ":" + second;
			},
			// 接口获取歌曲总毫秒数并转换为分钟/秒钟
			get_musicTime: function (time){
				var minute = Math.floor((time % 3600000) / 60000); // 分钟
				var second = Math.floor((time % 60000) / 1000); // 秒钟
				if(minute < 10){
					minute = "0" + minute;
				}
				if(second < 10){
					second = "0" + second;
				}
				return minute + ":" + second;
			},
			// 底部播放控制
			music_control: function(event){
				var audio = document.querySelector("#music");
				// 无音乐记录时不执行
				if(this.music_id != 0){
					var playing_icon = event.target;
					if(playing_icon.className === "fa fa-play" && audio.paused){
						audio.play();
						// 进度条实时移动,音乐时间实时改变
						this.music_interval = setInterval(this.music_content,1000);
						this.Lyric_interval = setInterval(this.lyricRoll,100);
						playing_icon.className = 'fa fa-pause';
					}else if(playing_icon.className === "fa fa-pause"){
						audio.pause();
						clearInterval(this.music_interval);
						clearInterval(this.Lyric_interval);
						playing_icon.className = 'fa fa-play';
					}
				}
			},
			// 载入所选音乐URL
			music_play: function(index){
				// 音乐索引
				var index = Number(index);
				// 歌曲控制栏弹出
				var musicControl = document.getElementById("music_control");
				musicControl.style.top = "0px";
				// 判断是否付费音乐
				var isVip = document.querySelector("#music_content li:nth-of-type("+(index+1)+")");
				// 弹出提示
				var message = document.querySelector("#message");
				if(isVip.className == "vip"){
					message.innerText = '当前歌曲为付费项目,请移步至网易云~'
					message.style.top = "10px";
					// 2秒后消失
					setTimeout(function(){message.style.top = "-40px"},2000);
				}else{
					// 歌词清空并滚动回顶部
					this.music_lyric = [];
					this.LyricCount = 0;
					var lyricBody = document.querySelector("#lyric");
					lyricBody.style.transform = "translateY(0)";
					// 信息录入
					this.music_id = this.music_list[index].id;
					this.get_cover(this.music_list[index].artists[0].id);
					this.get_lyric(this.music_list[index].id);
					this.music_name = this.music_list[index].name;
					this.music_singer = this.music_list[index].artists[0].name;
					this.music_album = this.music_list[index].album.name;
					// 音乐
					var audio = document.querySelector("#music");
					var that = this;
					// 音乐可以播放时运行
					audio.oncanplaythrough = function(){
						// 当前单击播放对象按钮消失,其他恢复
						var playBtnAll = document.querySelectorAll("#menu .play");
						for(var i=0;i<playBtnAll.length;i++){
							playBtnAll[i].classList.remove("active");
						}
						// 找到当前播放歌曲对应的播放按钮
						var playBtn = document.querySelector("#music_content li:nth-of-type("+(index+1)+") #menu .play");
						// 使其隐藏
						playBtn.classList.add("active");
						// 更改底部播放控制图标
						var play_icon = document.querySelector("#play");
						
						if(audio.paused){
							audio.play();
							that.music_interval = setInterval(that.music_content,1000);
							that.Lyric_interval = setInterval(that.lyricRoll,100);
							play_icon.className = 'fa fa-pause';
						}
					}
				}
			},
			//下一首
			next:function(){
				// 获取下一个li标签
				var next_music = document.querySelector("#music_content .play.active").parentNode.parentNode.parentNode.parentNode.nextSibling;
				if(next_music != null){
					var next_index = next_music.childNodes[0].childNodes[0].getAttribute("value");
					if(next_music.className === "vip"){
						this.music_play(Number(next_index) + 1);
						return
					}
					// 获取下一个音乐的索引
					this.music_play(next_index);
				}
			},
			// 上一首
			prev: function(){
				// 获取上一个li标签
				var prev_music = document.querySelector("#music_content i.active").parentNode.parentNode.parentNode.parentNode.previousSibling;
				if(prev_music != null){
					// 获取上一个音乐的索引
					var prev_index = prev_music.childNodes[0].childNodes[0].getAttribute("value");
					if(prev_music.className === "vip"){
						this.music_play(Number(prev_index) - 1);
						return
					}
					this.music_play(prev_index);
				}
			},
			// 获取歌曲歌词
			get_lyric: function(id){
				var that = this;
				axios.get("https://music.cyrilstudio.top/lyric?id="+id)
				.then(function(response){
					that.formatLyric(response.data.lrc.lyric);
				}).catch(function(err){
					console.log(err);
				});
			},
			// 格式化歌词
			formatLyric: function(text){
				//原歌词文本已经换好行了方便很多，我们直接通过换行符“\n”进行切割
				var arr = text.split("\n"); 
				//获取歌词行数
				var row = arr.length; 
				for (var i = 0; i < row; i++) {
					//现在每一行格式大概就是这样"[00:04.302][02:10.00]hello world";
					var temp_row = arr[i]; 
					//我们可以通过“]”对时间和文本进行分离
					var temp_arr = temp_row.split("]");
					//把歌词文本从数组中剔除出来，获取到歌词文本了！
					var text = temp_arr.pop(); 
					//再对剩下的歌词时间进行处理
					// 箭头函数
					temp_arr.forEach(element => {
						var obj = {};
						//先把多余的“[”去掉，再分离出分、秒
						var time_arr = element.substr(1, element.length - 1).split(":");
						//把时间转换成与currentTime相同的类型，方便待会实现滚动效果
						//                    分                           秒
						var s = parseInt(time_arr[0]) * 60 + Math.ceil(time_arr[1]); 
						if(text != ""){
							obj.time = s+1;
							obj.text = text;
							//每一行歌词对象存到组件的lyric歌词属性里
							this.music_lyric.push(obj); 
						}
					});
				}
			},
			// 取消所有歌词高亮
			lyricLight: function(p){
				for(var i=0;i<p.length;i++){
					p[i].className = "";
				}
			},
			// 歌词滚动
			lyricRoll: function(){
				try{
					var audio = document.querySelector("#music");
					var currentTime = Math.ceil(audio.currentTime);
					var lyricBody = document.querySelector("#lyric");
					var p = document.querySelectorAll("#lyric p");
					var lyric = this.music_lyric;
					var count = this.LyricCount;
					var c = this.LyricLight;
					if(currentTime == lyric[this.LyricCount].time){
						this.lyricLight(p);
						p[this.LyricCount].className = "active";
						// 当歌词当前行大于c位时才开始滚动
						if(count >= c){
							var p_width = parseInt(window.getComputedStyle(p[this.LyricCount]).height)+10;
							lyricBody.style.transform = "translateY("+((count-c)*(-p_width))+"px)";
						}
						this.LyricCount+=1;
					}
				}catch(e){
					//TODO handle the exception
				}
			},
			// 获取音乐附属MV
			get_mv: function(id,index){
				var that = this;
				axios.get("https://music.cyrilstudio.top/mv/url?id="+id)
				.then(function(response){
					that.music_mv = response.data.data;
					that.mv_name = that.music_list[index].name;
					that.mv_singer = that.music_list[index].artists[0].name;
					that.mv_album = that.music_list[index].album.name;
					that.openMv();
				}).catch(function(err){
					console.log(err);
				});
			},
			// 音乐MV模态框开启
			openMv: function(){
				var video = document.querySelector("#Mv");
				var mv = document.querySelector("#musicMv");
				var body_L = document.querySelector(".body_left");
				var body_R = document.querySelector(".body_right");
				var music_control = document.querySelector("#music_control");
				var mv_content = document.querySelector("#Mv_content");
				body_L.style.visibility = "hidden";
				body_R.style.visibility = "hidden";
				mv.style.top = "55px";
				music_control.style.top = "110px";
				mv_content.style.top = "0px";
				video.oncanplay = function(){
					video.play();
				}
				video.onended = function(){
					body_L.style.visibility = "visible";
					body_R.style.visibility = "visible";
					mv.style.top = "-550px";
					music_control.style.top = "0px";
					mv_content.style.top = "110px";
					video.pause();
				}
			},
			// 关闭音乐MV
			closeMv: function(){
				var video = document.querySelector("#Mv");
				var mv = document.querySelector("#musicMv");
				var body_L = document.querySelector(".body_left");
				var body_R = document.querySelector(".body_right");
				var music_control = document.querySelector("#music_control");
				var mv_content = document.querySelector("#Mv_content");
				body_L.style.visibility = "visible";
				body_R.style.visibility = "visible";
				mv.style.top = "-550px";
				music_control.style.top = "0px";
				mv_content.style.top = "110px";
				video.pause();
				this.music_mv = [];
			},
			// 清空播放列表
			clear_music: function(){
				this.music_list = [];
			},
			// 删除复选框选中的音乐
			remove_music: function(){
				var input_checked = document.querySelectorAll(".index");
				for(var i=input_checked.length-1;i>=0;i--){
					if(input_checked[i].checked){
						this.music_list.splice(i,1);
						input_checked[i].checked = '';
					}
				}
			},
			// 删除按钮
			delMusic: function(index){
				this.music_list.splice(index,1);
			},
			// 全选
			checkedAll_music: function(){
				var checkedAll = document.querySelector("#checkedAll");
				this.checkAll = !this.checkAll;
				checkedAll.checked = !this.checkAll;
				var input_checked = document.querySelectorAll(".index");
				for(var i=0;i<input_checked.length;i++){
					input_checked[i].checked = checkedAll.checked;
				}
			},
			musicChecked: function(index){
				var idChecked = document.querySelector("li:nth-of-type("+(index+1)+") #musicId .index");
				idChecked.checked = !idChecked.checked;
			},
			
			// 下载地址通过base64转码并迅雷下载
			ThunderDownload: function(id){
				var thunder_url = "AAhttps://music.163.com/song/media/outer/url?id="+id+".mp3ZZ";
				var url = Base64.encode(thunder_url);
				return url;
			}
		}
	});
}