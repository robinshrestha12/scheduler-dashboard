import React, { Component } from "react";

import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import axios from "axios";
import { getTotalInterviews, getLeastPopularTimeSlot, getMostPopularDay, getInterviewsPerDay  } from "helpers/selectors";
import { setInterview } from "helpers/reducers";
//data value is changed to get value and function is passed to get the value and also passed value to render function.
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {
  // adding keys to initial state object
  state = {
    loading: false,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  };
  
  //function to set state to selected id
  selectPanel(id) {

    this.setState(previousState => ({
      focused: previousState.focused != null ? null : id

    }));
  }
//when component mounts , data is requested and when data returns, this.setState is used to merge it into state objects.
  componentDidMount(){
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")      
    ]).then(([days, appointments, interviewers]) =>{
      this.setState({
        loading: false,
        days: days.data,
        appointments:appointments.data,
        interviewers:interviewers.data
      });
    });
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if(typeof data === "object" && data.type === "SET_INTERVIEW"){
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
          );
      }
    };
  }
  componentWillUnmount(){
    this.socket.close();
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused){
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  render() {
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    if (this.state.loading) {
      return <Loading />;
    }
   // console.log(this.state);
    const panels = (this.state.focused ? data.filter(panel => this.state.focused === panel.id) : data)
      .map(panel => (
        <Panel
          key={panel.id}          
          label={panel.label}
          value={panel.getValue(this.state)}
          onSelect={() => this.selectPanel(panel.id)}
        />
      ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
