/**
 * Created by Administrator on 2016/11/12.
 */

import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    ListView
} from 'react-native';

import Video from 'react-native-video';
import p from '../utils/TransForm';
import Icon from 'react-native-vector-icons/Ionicons';
import {get, post} from '../utils/Request';
import * as urlType from '../utils/Api';

const {width, height} = Dimensions.get('window');
// 缓存数据
let cacheData = {
    dataTotal: 0,
    videoCommentsListData: [],
    nextPage: 1
};

export default class VideoDetail extends Component {

    // 构造
    constructor(props) {
        super(props);
        // 初始状态
        this.state = {
            videoData: this.props.videoData,
            rate: 1,
            volume: 1,
            muted: false,
            paused: false,
            resizeMode: 'contain',
            duration: 0.0,
            currentTime: 0.0,
            isLoading: false,
            isLoaded: false,
            isError: false,
            isFullScreen: false,
            dataSource: new ListView.DataSource({
                rowHasChanged: (oldRow, newRow) => oldRow !== newRow
            }),
            isLoadingMore: false
        };
        // 绑定视频播放相关的回调函数
        this.onLoadStart = this.onLoadStart.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.onProgress = this.onProgress.bind(this);
        this.onEnd = this.onEnd.bind(this);
        this.onError = this.onError.bind(this);
        this.onReturn = this.onReturn.bind(this);
        this.repeatPlay = this.repeatPlay.bind(this);
        this.pausePlay = this.pausePlay.bind(this);
        this.resumePlay = this.resumePlay.bind(this);
        this.onFullScreen = this.onFullScreen.bind(this);

        this.renderCommentsList = this.renderCommentsList.bind(this);
        this.fetchMoreData = this.fetchMoreData.bind(this);
        this.renderFooterView = this.renderFooterView.bind(this);
    }

    /** 组件加载完成的时候调用 **/
    componentDidMount() {
        this.fetchNetData(1);
    }

    //从网络加载数据
    fetchNetData(page) {
        if (page !== 0) {
            //上拉加载更多
            this.setState({
                isLoadingMore: true
            });
        }
        get(urlType.videoComments(), {videoId: '12323', page: page}).then(result=> {
            //把数据存入缓存,先取出原有的数据
            let listData = cacheData.videoCommentsListData.slice();
            //将原有的数据和新的数据拼接
            if (page !== 0) {
                //上拉加载更多
                console.log('执行了加载更多---------------');
                cacheData.videoCommentsListData = listData.concat(result.data);
                //下一页
                cacheData.nextPage += 1;
            }
            //存入数据总长度
            cacheData.dataTotal = result.total;
            console.log('总个数据的长度是：' + cacheData.dataTotal);
            console.log('当前的listView数据的总长度是：' + cacheData.videoCommentsListData.length);
            if (page !== 0) {
                //上拉加载更多
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(cacheData.videoCommentsListData),
                    isLoadingMore: false
                })
            }
        }).catch((result)=> {
            if (page !== 0) {
                this.setState({
                    isLoadingMore: false
                });
            }
            console.log('网络请求失败' + result);
        })
    }

    render() {
        let videoData =  this.state.videoData;
        console.log('视频播放地址：'+videoData.videoUrl);
        const flexCompleted = this.getCurrentTimePercentage() * 100;
        const flexRemaining = (1 - this.getCurrentTimePercentage()) * 100;
        return (
            <View style={styles.container}>
                <View style={styles.videoBox}>

                    {/** 视频播放界面 **/}
                    <Video
                        ref="videoPlayer"
                        source={{uri: videoData.videoUrl}}
                        repeat={false}
                        rate={this.state.rate}
                        paused={this.state.paused}
                        volume={this.state.volume}
                        muted={this.state.muted}
                        resizeMode={this.state.resizeMode}
                        onLoadStart={this.onLoadStart}
                        onLoad={this.onLoad}
                        onProgress={this.onProgress}
                        onEnd={this.onEnd}
                        onError={this.onError}
                        style={styles.videoPlayStyle}
                    />
                    {/** 视频Load加载提示 **/}
                    {
                        !this.state.isLoaded ?
                        <ActivityIndicator
                            color={'#FF3333'}
                            size={'large'}
                            style={styles.startLoadingStyle}
                        /> :null
                    }
                    {/** 视频加载出错 **/}
                    {
                        this.state.isError ?
                        <View style={styles.loadingErrorViewStyle}>
                            <Text style={styles.loadingErrorStyle}>很抱歉,视频出错啦！</Text>
                        </View> :null
                    }
                    {/** 视频暂停与播放 **/}
                    {
                        this.state.isLoaded && this.state.isLoading ?
                        <TouchableOpacity
                            onPress={this.pausePlay}
                            style={styles.pauseVideoAreaStyle}
                        >
                            {
                                this.state.paused ?
                                <Icon
                                    name='ios-play'
                                    size={36}
                                    onPress={this.resumePlay}
                                    style={styles.repeatPlayIconStyle}
                                /> :null
                            }
                        </TouchableOpacity> : null
                    }
                    {/** 重新播放按钮 **/}
                    {
                        this.state.isLoaded && !this.state.isLoading ?
                        <Icon
                            name='ios-play'
                            size={36}
                            onPress={this.repeatPlay}
                            style={styles.repeatPlayIconStyle}
                        /> :null
                    }
                    {/** 视频缓冲进度条 **/}
                    <View style={styles.progress}>
                        <View style={[styles.innerProgressCompleted, {flex: flexCompleted}]} />
                        <View style={[styles.innerProgressRemaining, {flex: flexRemaining}]} />
                    </View>
                </View>
                {/** 返回按钮 **/}
                <Icon
                    name={'ios-arrow-back'}
                    size={p(56)}
                    onPress={this.onReturn}
                    style={styles.returnIconStyle}
                />
                {/** 全屏按钮 **/}
                {
                    !this.state.isFullScreen ?
                    <Icon
                        name='ios-expand'
                        size={36}
                        onPress={this.onFullScreen}
                        style={styles.fullScreenIconStyle}
                    />: null
                }
                {/** 视频详情评论列表 **/}
                <ListView
                    style={styles.listViewStyle}
                    dataSource={this.state.dataSource}
                    renderRow={this.renderCommentsList}
                    renderHeader={this.renderHeaderView.bind(this, videoData)}
                    enableEmptySections={true}
                    automaticallyAdjustContentInsets={false}
                    onEndReachedThreshold={10}
                    onEndReached={this.fetchMoreData}
                    renderFooter={this.renderFooterView}
                />

            </View>
        );
    }


    // 全屏，Android客户端有点问题
    onFullScreen() {
        this.refs.videoPlayer.presentFullscreenPlayer();
        this.setState({
            isFullScreen: true
        });
    }


    // 获取当前播放的进度
    getCurrentTimePercentage() {
        if (this.state.currentTime > 0) {
            return parseFloat(this.state.currentTime) / parseFloat(this.state.duration);
        } else {
            return 0;
        }
    }


    // 暂停播放
    pausePlay() {
        if (!this.state.paused) {
            this.setState({
                paused: true
            })
        }
    }


    // 重新播放
    resumePlay() {
        if (this.state.paused) {
            this.setState({
                paused: false
            })
        }
    }


    // 重新播放视频
    repeatPlay() {
        this.refs.videoPlayer.seek(0);
    }

    // 返回
    onReturn() {
        let {navigator} = this.props;
        if (navigator) {
            navigator.pop();
        }
    }

    // 当视频开始加载时回调
    onLoadStart(videoData) {
        console.log('onLoadStart----视频总长度:'+videoData.duration);
    }

    // 视频加载时候的回调
    onLoad(data) {
        this.setState({
            duration: data.duration
        });
    }

    // 视频进度回调，250ms回调与当前时间
    onProgress(videoData) {
        if(!this.state.isLoaded){
            this.setState({
                isLoaded: true
            });
        }
        if(!this.state.isLoading){
            this.setState({
                isLoading: true
            });
        }
        console.log('_onProgress----数据对象：'+JSON.stringify(videoData));
        console.log('_onProgress----当前时间：'+videoData.currentTime);
        this.setState({currentTime: videoData.currentTime});
    }

    // 播放结束时的回调
    onEnd() {
        console.log('onEnd');
        this.setState({
            currentTime: this.state.duration,
            isLoading: false
        })
    }

    // 无法加载视频时回调
    onError(error) {
        console.log('错误：'+JSON.stringify(error));
        this.setState({
            isError: true
        })
    }

    // 其他用户信息列表
    renderCommentsList(rowData) {
        console.log('服务器返回数据：');
        console.log(rowData);
        return (
            <View style={styles.otherContainerStyle}>
                <Image
                    style={styles.otherAvatarStyle}
                    source={{uri: rowData.commentsInfo.avatar}}
                />
                <View style={[styles.otherInfoStyle, {width: width - p(160)}]}>
                    <Text style={styles.otherNikNameStyle}>{rowData.commentsInfo.nickName}</Text>
                    <Text style={styles.otherCommentsContentStyle} numberOfLines={2}>{rowData.commentsInfo.content}</Text>
                </View>
            </View>
        );
    }

    // 上拉加载更多
    fetchMoreData() {
        if (!this.isHasMore() || this.state.isLoadingMore) {
            console.log('没有数据了...');
            return ;
        }else {
            //加载更多
            console.log('加载更多...');
            let page = cacheData.nextPage;
            this.fetchNetData(page);
        }
    };


    // 判断是否有更多数据
    isHasMore() {
        if (cacheData.videoCommentsListData.length >= cacheData.dataTotal) {
            return false;
        }else {
            return true;
        }
    }

    // 加载更多进度
    renderFooterView() {
        // 数据加载完毕
        if(!this.isHasMore() && cacheData.dataTotal !== 0){
            return (
                <View style={styles.loadingMoreViewStyle}>
                    <Text style={styles.loadingMoreTextStyle}>没有更多数据啦...</Text>
                </View>
            );
        }
        // 不是正在加载更多
        if(!this.state.isLoadingMore){
            return <View style={styles.loadingMoreViewStyle}/>
        }
        // 不是正在加载更多
        return (
            <View style={styles.loadingMoreViewStyle}>
                <ActivityIndicator size="small" color="#ff3333"/>
                <Text style={styles.loadingMoreTitleStyle}>
                    数据加载中……
                </Text>
            </View>
        );
    }

    // 用户评论信息
    renderHeaderView(videoData) {
        return (
        <View style={styles.userContainerStyle}>
            <Image
                style={styles.userAvatarStyle}
                source={{uri: videoData.userInfo.avatar}}
            />
            <View style={[styles.userInfoStyle, {width: width - p(160)}]}>
                <Text style={styles.userNikNameStyle}>{videoData.userInfo.nickName}</Text>
                <Text style={styles.videoTitleStyle} numberOfLines={2}>{videoData.title}</Text>
            </View>
        </View>
        );
    }

}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F5FCFF',
    },
    videoBox: { //视频容器
        width: width,
        height: p(615),
        backgroundColor: 'black'
    },
    videoPlayStyle: { //视频播放界面
        width: width,
        height: p(600),
        backgroundColor: 'black'
    },
    returnIconStyle: { //返回按钮
        top: 0,
        left: 0,
        marginLeft: p(30),
        marginTop: p(30),
        color: 'white',
        position: 'absolute'
    },
    repeatPlayIconStyle: { //重新播放按钮
        top: p(300) - 18,
        left: width/2 - 18,
        width: p(92),
        height: p(92),
        paddingLeft: p(36),
        paddingTop: p(16),
        backgroundColor: 'transparent',
        borderColor: '#E8E8E8',
        borderRadius: p(46),
        borderWidth: p(2),
        position: 'absolute',
        color: 'white'
    },
    startLoadingStyle: { //视频加载提示
        position:'absolute',
        left: 0,
        width: width,
        top: p(300),
        backgroundColor:'transparent',
        alignSelf:'center'
    },
    progress: { //进度条容器
        flex: 1,
        flexDirection: 'row',
        borderRadius: 3,
        overflow: 'hidden'
    },
    innerProgressCompleted: { //缓冲完之后的进度条
        height: 3,
        backgroundColor: '#4CBD3A'
    },
    innerProgressRemaining: { // 长在缓存的进度条
        height: 3,
        backgroundColor: '#828282'
    },
    pauseVideoAreaStyle: { //暂停与播放
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: p(600)
    },
    loadingErrorViewStyle: { //视频加载出错
        position:'absolute',
        left: 0,
        width: width,
        top: p(360),
        backgroundColor:'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingErrorStyle: { //视频加载出错文字
        fontSize: p(26),
        color: '#FF3333'
    },
    fullScreenIconStyle: { //全屏按钮
        top: p(520),
        right: p(20),
        color: 'white',
        position: 'absolute'
    },
    userContainerStyle: { //详情列表条目
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: p(20),
        marginHorizontal: p(20)
    },
    userAvatarStyle: { //用户头像
        width: p(100),
        height: p(100),
        borderRadius: p(50),
    },
    userInfoStyle: { //用户信息
        marginLeft: p(20)
    },
    userNikNameStyle: { //用户的昵称
        fontSize: p(26),
        color: '#2E2E2E'
    },
    videoTitleStyle: { //视频的标题
        fontSize: p(24),
        color: '#333333',
        marginTop: p(10)
    },
    otherContainerStyle: { //其他详情列表条目
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: p(20),
        marginHorizontal: p(20)
    },
    otherAvatarStyle: { //其他用户头像
        width: p(100),
        height: p(100),
        borderRadius: p(50),
    },
    otherInfoStyle: { //其他用户信息
        marginLeft: p(20)
    },
    otherNikNameStyle: { //其他用户的昵称
        fontSize: p(26),
        color: '#436EEE'
    },
    otherCommentsContentStyle: { //其他用户评论内容
        fontSize: p(24),
        color: '#5E5E5E',
        marginTop: p(10)
    },
    loadingMoreViewStyle: { //加载更多View
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: p(40)
    },
    loadingMoreTextStyle: { //加载完更多文字
        fontSize: p(22)
    },
    loadingMoreTitleStyle: { //正在加载更多文字
        textAlign: 'center',
        fontSize: p(22),
        marginLeft: p(20),
        color: '#979797'
    }
});